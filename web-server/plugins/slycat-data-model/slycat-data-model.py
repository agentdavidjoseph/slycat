# Copyright (c) 2013, 2018 National Technology and Engineering Solutions of Sandia, LLC . Under the terms of Contract
# DE-NA0003525 with National Technology and Engineering Solutions of Sandia, LLC, the U.S. Government
# retains certain rights in this software.

# coding=utf-8

def register_slycat_plugin(context):
    """
  Called during startup when the plugin is loaded.
  :param context:
  """
    import cherrypy
    import datetime
    import json
    import numpy
    import os
    import re
    import slycat.web.server

    def media_columns(database, model, verb, type, command, **kwargs):
        """
    Identify columns in the input data that contain media URIs (image or video).
    Arguments:
      database {Object} -- connection to the database
      current_selected_model {object} -- json meta data for a model
      verb {object} -- not used
      type {object} -- not used
      command {string} -- command name
    Returns:
      [type] -- [description]
    """

        expression = re.compile('file://|http')
        search = numpy.vectorize(lambda x: bool(expression.search(x)))

        columns = []
        metadata = slycat.web.server.get_model_arrayset_metadata(database, model, "data-table", "0")["arrays"][0]
        for index, attribute in enumerate(metadata["attributes"]):
            if attribute["type"] != "string":
                continue
            column = slycat.web.server.get_model_arrayset_data(database, model, "data-table", "0/%s/..." % index)
            if not numpy.any(search(column)):
                continue
            columns.append(index)

        cherrypy.response.headers["content-type"] = "application/json"
        return json.dumps(columns).encode()

    def get_example(database, current_selected_model, verb, type, command, **kwargs):
        """
        stub
        """
        response = {"success": "success"}
        return json.dumps(response)

    # database, parser, input, attachment, model, aid
    def post_example(database, model, verb, type, command, **kwargs):
        """
        stub
        """
        # linked_models = kwargs["linked_models"]
        response = {"success": "success"}
        return json.dumps(response)

    def finish(database, model):
        """
    Called to finish the model.
    This function must return immediately,
    so any real work would be done in a separate thread.
    :param model:
      model ID in the data base
    :param database:
      our connection to couch db
    """
        slycat.web.server.update_model(database, model, state="finished", result="succeeded",
                                       finished=datetime.datetime.utcnow().isoformat(), progress=1.0, message="")

    # Register our new model type
    context.register_model("data-model", finish)

    # Register custom commands for use by wizards.
    context.register_model_command("GET", "data-model", "media-columns", media_columns)
    context.register_model_command("GET", "data-model", "get_example", get_example)
    context.register_model_command("POST", "data-model", "post-example", post_example)

    # Register custom wizards for creating PI models.
    context.register_wizard("data-model", "New data",
                            require={"action": "create", "context": "project"})
