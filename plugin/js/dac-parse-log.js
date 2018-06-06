/* Copyright (c) 2013, 2018 National Technology and Engineering Solutions of Sandia, LLC . Under the terms of Contract
 DE-NA0003525 with National Technology and Engineering Solutions of Sandia, LLC, the U.S. Government
 retains certain rights in this software. */

// this is the code for showing the parse log, if it exists
// originally copied from the model details code (plugins/slycat-model-wizards/info-ui.js)
define(["slycat-server-root", "slycat-web-client", "knockout", "URI", "knockout-mapping"], function(server_root, client, ko, URI, mapping) {
  var constructor = function(params) {
    var component = {};
    component.project = params.projects()[0];
    component.model = params.models()[0];
    component.details = mapping.fromJS({
      total_server_data_size: 0,
      mid: "",
      hdf5_file_size: 0,
      hdf5_store_size: 0,
      couchdb_doc_size: 0,
      delta_creation_time: 0,
      job_pending_time: 0,
      job_running_time: 0,
      model_compute_time: 0,
      hdf5_footprint: 0,
      server_cache_size: 0,
      analysis_computation_time:0,
      db_creation_time: 0,
      model: null
    });

    $.ajax({
      dataType: "json",
      type: "GET",
      url: URI(server_root + "get-model-statistics/" + component.model._id()),
      success: function(result)
      {
        mapping.fromJS(result, component.details);
      },
      error: function(request, status, reason_phrase)
      {
        window.alert("error request:" + request.responseJSON +" status: "+ status + " reason: " + reason_phrase);
        console.log("error request:" + request.responseJSON +" status: "+ status + " reason: " + reason_phrase);
      }
    });

    // we want a large dialog box
    $(".modal-dialog").addClass("modal-lg");

    return component;
  };

  return {
    viewModel: constructor,
    template: {
      require: "text!" + server_root + "resources/wizards/dac-show-parse-log/ui.html"
    }
  };
});
