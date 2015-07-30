def register_slycat_plugin(context):
  """Called during startup when the plugin is loaded."""
  import cherrypy
  import datetime
  import collections
  import json
  import numpy
  import os
  import re
  import slycat.web.server.database.couchdb
  import slycat.web.server
  import threading
  import traceback

  class ImageCache(object):
    def __init__(self):
      self._reset()

    def _reset(self):
      self._storage = {}

    def reset(self):
      #slycat.web.client.log.info("Resetting image cache.")
      self._reset()

    def image(self, path, process=lambda x,y:x):
      if path not in self._storage:
        #slycat.web.client.log.info("Loading %s." % path)
        import PIL.Image
        try:
          self._storage[path] = process(numpy.asarray(PIL.Image.open(path)), path)
        except Exception as e:
          #slycat.web.client.log.error(str(e))
          self._storage[path] = None
      return self._storage[path]

  image_cache = ImageCache()

  def csv_distance(left_index, left_path, right_index, right_path):
    return csv_distance.matrix[left_index, right_index]
  csv_distance.matrix = None

  # Map measure names to functions
  measures = {
    # "identity" : identity_distance,
    # "jaccard" : jaccard_distance,
    # "euclidean-rgb" : euclidean_rgb_distance,
    "csv" : csv_distance,
    }

  def compute_distance(left, right, storage, cluster_name, measure_name, measure):
    distance = numpy.empty(len(left))
    for index in range(len(left)):
      i = left[index]
      j = right[index]
      row_i, column_i = storage[i]
      uri_i = columns[column_i][1][row_i]
      path_i = urlparse.urlparse(uri_i).path
      row_j, column_j = storage[j]
      uri_j = columns[column_j][1][row_j]
      path_j = urlparse.urlparse(uri_j).path
      distance[index] = measure(i, path_i, j, path_j)
      #slycat.web.client.log.info("Computed %s distance for %s, %s -> %s: %s." % (measure_name, cluster_name, i, j, distance[index]))
    return distance

  def media_columns(database, model, verb, type, command, **kwargs):
    """Identify columns in the input data that contain media URIs (image or video)."""
    expression = re.compile("file://")
    search = numpy.vectorize(lambda x:bool(expression.search(x)))

    columns = []
    metadata = slycat.web.server.get_model_arrayset_metadata(database, model, "data-table", "0")["arrays"][0]
    for index, attribute in enumerate(metadata["attributes"]):
      if attribute["type"] != "string":
        continue
      column = next(slycat.web.server.get_model_arrayset_data(database, model, "data-table", "0/%s/..." % index))
      if not numpy.any(search(column)):
        continue
      columns.append(index)

    cherrypy.response.headers["content-type"] = "application/json"
    return json.dumps(columns)

  def compute(mid):
    """Called in a thread to perform work on the model."""
    try:
      database = slycat.web.server.database.couchdb.connect()
      model = database.get("model", mid)

      # Do useful work here
      try:
        clusters = slycat.web.server.get_model_file(database, model, "clusters")
        print "we have a clusters file, so no work needs to be done on the server"
      except:
        import pudb; pu.db
        cluster_columns = slycat.web.server.get_model_parameter(database, model, "cluster-columns")
        metadata = slycat.web.server.get_model_arrayset_metadata(database, model, "data-table")
        column_infos = metadata[0]['attributes']
        column_data = list(slycat.web.server.get_model_arrayset_data(database, model, "data-table", ".../.../..."))
        columns = []
        for column_index, column_info in enumerate(column_infos):
          columns.append((column_info['name'], column_data[column_index]))

        distance_matrix_data = list(slycat.web.server.get_model_arrayset_data(database, model, "distance-matrix", ".../.../..."))

        # Create a mapping from unique cluster names to column rows.
        clusters = collections.defaultdict(list)
        for column_index, (name, column) in enumerate(columns):
          if name not in [cluster_columns]:
            continue
          for row_index, row in enumerate(column):
            if row:
              clusters[name].append((row_index, column_index))

        # Compute a hierarchical clustering for each cluster column.
        cluster_linkages = {}
        cluster_exemplars = {}

        for index, (name, storage) in enumerate(sorted(clusters.items())):
          image_cache.reset()
          progress_begin = float(index) / float(len(clusters))
          progress_end = float(index + 1) / float(len(clusters))

          # Compute a distance matrix comparing every image to every other ...
          observation_count = len(storage)
          left, right = numpy.triu_indices(observation_count, k=1)
          distance = compute_distance(left, right, storage, name, arguments.cluster_measure, measures[arguments.cluster_measure])

          # Use the distance matrix to cluster observations ...
          #slycat.web.client.log.info("Clustering %s" % name)
          #distance = scipy.spatial.distance.squareform(distance_matrix)
          linkage = scipy.cluster.hierarchy.linkage(distance, method=str(arguments.cluster_linkage))
          cluster_linkages[name] = linkage

          # Identify exemplar waveforms for each cluster ...
          distance_matrix = scipy.spatial.distance.squareform(distance)

          summed_distances = numpy.zeros(shape=(observation_count))
          exemplars = dict()
          cluster_membership = []

          for i in range(observation_count):
            exemplars[i] = i
            cluster_membership.append(set([i]))

          #slycat.web.client.log.info("Identifying examplars for %s" % (name))
          for i in range(len(linkage)):
            cluster_id = i + observation_count
            (f_cluster1, f_cluster2, height, total_observations) = linkage[i]
            cluster1 = int(f_cluster1)
            cluster2 = int(f_cluster2)
            # Housekeeping: assemble the membership of the new cluster
            cluster_membership.append(cluster_membership[cluster1].union(cluster_membership[cluster2]))
            # We need to update the distance from each member of the new
            # cluster to all the other members of the cluster.  That means
            # that for all the members of cluster1, we need to add in the
            # distances to members of cluster2, and for all members of
            # cluster2, we need to add in the distances to members of
            # cluster1.
            for cluster1_member in cluster_membership[cluster1]:
              for cluster2_member in cluster_membership[cluster2]:
                summed_distances[cluster1_member] += distance_matrix[cluster1_member][cluster2_member]

            for cluster2_member in cluster_membership[int(cluster2)]:
              for cluster1_member in cluster_membership[cluster1]:
                summed_distances[cluster2_member] += distance_matrix[cluster2_member][cluster1_member]

            min_summed_distance = None
            max_summed_distance = None

            exemplar_id = 0
            for member in cluster_membership[cluster_id]:
              if min_summed_distance is None or summed_distances[member] < min_summed_distance:
                min_summed_distance = summed_distances[member]
                exemplar_id = member

              if max_summed_distance is None or summed_distances[member] > min_summed_distance:
                max_summed_distance = summed_distances[member]

            exemplars[cluster_id] = exemplar_id
          cluster_exemplars[name] = exemplars


        print "we have no clusters file, now we need to create it on the server!!!"
        # import pudb; pu.db
        # import pdb; pdb.set_trace()

      slycat.web.server.update_model(database, model, state="finished", result="succeeded", finished=datetime.datetime.utcnow().isoformat(), progress=1.0, message="")

    except:
      cherrypy.log.error("%s" % traceback.format_exc())

      database = slycat.web.server.database.couchdb.connect()
      model = database.get("model", mid)
      slycat.web.server.update_model(database, model, state="finished", result="failed", finished=datetime.datetime.utcnow().isoformat(), message=traceback.format_exc())

  def finish(database, model):
    """Called to finish the model.  This function must return immediately, so the actual work is done in a separate thread."""
    thread = threading.Thread(name="Compute Generic Model", target=compute, kwargs={"mid" : model["_id"]})
    thread.start()

  def html(database, model):
    """Add the HTML representation of the model to the context object."""
    import json
    import pystache

    context = dict()
    context["formatted-model"] = json.dumps(model, indent=2, sort_keys=True)
    context["_id"] = model["_id"];
    context["name"] = model["name"];
    context["full-project"] = database.get("project", model["project"]);
    return pystache.render(open(os.path.join(os.path.dirname(__file__), "ui.html"), "r").read(), context)

  # Register our new model type
  context.register_model("parameter-image-plus", finish, html)

  # Register JS
  javascripts = [
    "jquery-ui-1.10.4.custom.min.js",
    "jquery.layout-latest.min.js",
    "d3.min.js",
    "jquery.scrollintoview.min.js",
    "jquery.event.drag-2.2.js",
    "slick.core.js",
    "slick.grid.js",
    "slick.rowselectionmodel.js",
    "slick.headerbuttons.js",
    "slick.autotooltips.js",
    "slick.slycateditors.js",
    "chunker.js",
    "login.js",
    "color-switcher.js",
    "parameter-controls.js",
    "parameter-image-table.js",
    "parameter-image-dendrogram.js",
    "parameter-image-scatterplot.js",
    "ui.js",
    #For development and debugging, comment out js here and load it dynamically inside model.
  ]
  context.register_model_bundle("parameter-image-plus", "text/javascript", [
    os.path.join(os.path.join(os.path.dirname(__file__), "js"), js) for js in javascripts
    ])

  # Register CSS
  stylesheets = [
    "jquery-ui-1.10.4.custom.min.css",
    "slick.grid.css",
    "slick-default-theme.css",
    "slick.headerbuttons.css",
    "slick-slycat-theme.css",
    "ui.css"
  ]
  context.register_model_bundle("parameter-image-plus", "text/css", [
    os.path.join(os.path.join(os.path.dirname(__file__), "css"), css) for css in stylesheets
    ])

  # Register images and other resources
  images = [
    "x-gray.png",
    "x-light.png",
    "y-gray.png",
    "y-light.png",
    "sort-asc-light.png",
    "sort-asc-gray.png",
    "sort-desc-light.png",
    "sort-desc-gray.png",
    "image-gray.png",
    "image-light.png",
    "stripe1.png",
    "stripe2.png",
    "pin.png",
    "sort-dendrogram-selected.png",
    "sort-dendrogram.png",
  ]
  for image in images:
    context.register_model_resource("parameter-image-plus", image, os.path.join(os.path.join(os.path.dirname(__file__), "img"), image))

  # Register jquery ui images, which are expected in images folder
  jqimages = [
    "ui-bg_glass_75_e6e6e6_1x400.png",
    "ui-icons_222222_256x240.png",
    "ui-bg_highlight-soft_75_cccccc_1x100.png",
    "ui-bg_flat_75_ffffff_40x100.png",
    "ui-bg_flat_0_aaaaaa_40x100.png",
  ]
  for jqimage in jqimages:
    context.register_model_resource("parameter-image-plus", "images/" + jqimage, os.path.join(os.path.join(os.path.dirname(__file__), "img"), jqimage))

  devs = [
    # "js/parameter-image-dendrogram.js",
    # "js/parameter-image-scatterplot.js",
    # "js/ui.js",
  ]
  for dev in devs:
    context.register_model_resource("parameter-image-plus", dev, os.path.join(os.path.dirname(__file__), dev))

  # Register custom commands for use by wizards.
  context.register_model_command("GET", "parameter-image-plus", "media-columns", media_columns)

  # Register custom wizards for creating PI models.
  context.register_wizard("parameter-image-plus", "New Parameter Image Plus Model", require={"action":"create", "context":"project"})
  context.register_wizard_resource("parameter-image-plus", "ui.js", os.path.join(os.path.dirname(__file__), "js/wizard-ui.js"))
  context.register_wizard_resource("parameter-image-plus", "ui.html", os.path.join(os.path.dirname(__file__), "wizard-ui.html"))
