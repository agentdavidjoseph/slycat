(function()
{
  ko.components.register("slycat-header",
  {
    viewModel: function(params)
    {
      var server_root = document.querySelector("#slycat-server-root").getAttribute("href");
      var component = this;

      component.server_root = server_root;
      component.model_root = server_root + "models/";
      component.projects_url = server_root + "projects";
      component.project_name = params.project_name;
      component.project_url = server_root + "projects/" + params.project_id;
      component.model_name = ko.observable(params.model_name);
      component.model_description = ko.observable(params.model_description);
      component.new_model_name = ko.observable(params.model_name);
      component.new_model_description = ko.observable(params.model_description);
      component.new_name = ko.observable("");
      component.new_description = ko.observable("");
      component.logo_url = server_root + "css/slycat-small.png";
      component.user = {uid : ko.observable(""), name : ko.observable("")};
      component.version = ko.observable("");
      component.brand_image = server_root + "css/slycat-brand.png";
      component.open_models = ko.mapping.fromJS([]);
      component.finished_models = component.open_models.filter(function(model)
      {
        return model.state() == "finished";
      });
      component.running_models = component.open_models.filter(function(model)
      {
        return model.state() != "finished";
      });

      component.close_model = function(model)
      {
        $.ajax(
        {
          contentType : "application/json",
          data : $.toJSON({ "state" : "closed" }),
          processData : false,
          type : "PUT",
          url : server_root + "models/" + model._id(),
        });
      }

      component.save_model_changes = function()
      {
        component.model_name(component.new_model_name());
        component.model_description(component.new_model_description());

        var model =
        {
          "name" : component.new_model_name(),
          "description" : component.new_model_description(),
        };

        $.ajax(
        {
          type : "PUT",
          url : server_root + "models/" + params.model_id,
          contentType : "application/json",
          data : $.toJSON(model),
          processData : false,
          error : function(request, status, reason_phrase)
          {
            window.alert("Error updating model: " + reason_phrase);
          }
        });
      }

      component.delete_model = function()
      {
        if(window.confirm("Delete " + component.model_name() + "? All data will be deleted immediately, and this cannot be undone."))
        {
          $.ajax(
          {
            type : "DELETE",
            url : server_root + "models/" + params.model_id,
            success : function()
            {
              window.location.href = server_root + "projects/" + params.project_id;
            }
          });
        }
      }

      component.open_documentation = function()
      {
        window.open("http://slycat.readthedocs.org");
      }

      component.support_request = function()
      {
        $.ajax(
        {
          type : "GET",
          url : server_root + "configuration/support-email",
          success : function(email)
          {
            window.location.href = "mailto:" + email.address + "?subject=" + email.subject;
          }
        });
      }

      // Get information about the currently-logged-in user.
      $.ajax(
      {
        type : "GET",
        url : server_root + "users/-",
        success : function(user)
        {
          component.user.uid(user.uid);
          component.user.name(user.name);
        }
      });

      // Get information about the current server version.
      $.ajax(
      {
        type : "GET",
        url : server_root + "configuration/version",
        success : function(version)
        {
          component.version("Version " + version.version + ", commit " + version.commit);
        }
      });

      // Get information about open models.
      var current_revision = null;
      function get_models()
      {
        $.ajax(
        {
          dataType : "text",
          type : "GET",
          cache : false, // Don't cache this request; otherwise, the browser will display the JSON if the user leaves this page then returns.
          url : server_root + "models" + (current_revision != null ? "?revision=" + current_revision : ""),
          success : function(text)
          {
            // https://github.com/jquery/jquery-migrate/blob/master/warnings.md#jqmigrate-jqueryparsejson-requires-a-valid-json-string
            var results = text ? $.parseJSON(text) : null;
            if(results)
            {
              current_revision = results.revision;
              ko.mapping.fromJS(results.models, component.open_models);
            }

            // Restart the request immediately.
            window.setTimeout(get_models, 10);
          },
          error : function(request, status, reason_phrase)
          {
            // Rate-limit requests when there's an error.
            window.setTimeout(get_models, 5000);
          }
        });
      }

      get_models();
    },
    template: ' \
<div class="bootstrap-styles"> \
  <nav class="navbar navbar-default" role="navigation"> \
    <div class="container"> \
      <div class="navbar-header"> \
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#slycat-header-content"> \
          <span class="sr-only">Toggle navigation</span> \
          <span class="icon-bar"></span> \
          <span class="icon-bar"></span> \
          <span class="icon-bar"></span> \
        </button> \
        <a class="navbar-brand" data-bind="attr:{href:projects_url}">Slycat</a> \
      </div> \
      <div class="collapse navbar-collapse" id="slycat-header-content"> \
        <ol class="breadcrumb navbar-left"> \
          <li><a data-bind="attr:{href:projects_url}">Projects</a></li> \
          <li><a data-bind="text:project_name, attr:{href:project_url}"></a></li> \
          <li class="active"><a id="slycat-model-description" data-bind="text:model_name,popover:{options:{content:model_description}}"></a></li> \
        </ol> \
        <ul class="nav navbar-nav navbar-left" data-bind="visible: open_models().length"> \
          <li class="dropdown"> \
            <a class="dropdown-toggle" data-toggle="dropdown"><span class="badge"><span data-bind="text:running_models().length"></span> / <span data-bind="text:finished_models().length"></span></span><span class="caret"></span></a> \
            <ul class="dropdown-menu" role="menu"> \
              <!-- ko foreach: finished_models --> \
                <li> \
                  <a data-bind="attr:{href:$parent.model_root + $data._id()}"> \
                    <button type="button" class="btn btn-default btn-xs" data-bind="click:$parent.close_model,clickBubble:false,css:{\'btn-success\':$data.result()===\'succeeded\',\'btn-danger\':$data.result()!==\'succeeded\'}"><span class="glyphicon glyphicon-ok"></span></button> \
                    <span data-bind="text:name"></span> \
                  </a> \
                </li> \
              <!-- /ko --> \
              <li class="divider" data-bind="visible:finished_models().length && running_models().length"></li> \
              <!-- ko foreach: running_models --> \
                <li> \
                  <a data-bind="attr:{href:$parent.model_root + $data._id()}"> \
                    <span data-bind="text:name"></span> \
                  </a> \
                  <div style="height:10px; margin: 0 10px" data-bind="progress:{value:$data.progress() * 100.0,type:$data.state()===\'running\' ? \'success\' : null}"> \
                </li> \
              <!-- /ko --> \
            </ul> \
          </li> \
        </ul> \
        <ul class="nav navbar-nav navbar-right"> \
          <li><button type="button" class="btn btn-xs btn-warning navbar-btn" data-toggle="modal" data-target="#slycat-edit-model">Edit Model</button></li> \
          <li class="navbar-text"><span data-bind="text:user.name"></span> (<span data-bind="text:user.uid"></span>)</li> \
          <li class="dropdown"> \
            <a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Help <span class="caret"></span></a> \
            <ul class="dropdown-menu" role="menu"> \
              <li><a data-toggle="modal" data-target="#slycat-about">About Slycat</a></li> \
              <li><a data-bind="click:support_request">Support Request</a></li> \
              <li><a data-bind="click:open_documentation">Documentation</a></li> \
            </ul> \
          </li> \
        </ul> \
      </div> \
    </div> \
  </nav> \
  <div class="modal fade" id="slycat-about"> \
    <div class="modal-dialog"> \
      <div class="modal-content"> \
        <div class="modal-body"> \
          <div class="jumbotron"> \
            <img data-bind="attr:{src:brand_image}"/> \
            <p>&hellip; is the web-based analysis and visualization platform created at Sandia National Laboratories.</p> \
          </div> \
          <p data-bind="text:version"></p> \
          <p><small>Copyright 2013, Sandia Corporation. Under the terms of Contract DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains certain rights in this software.</small></p> \
        </div> \
        <div class="modal-footer"> \
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> \
        </div> \
      </div> \
    </div> \
  </div> \
  <div class="modal fade" id="slycat-edit-model"> \
    <div class="modal-dialog"> \
      <div class="modal-content"> \
        <div class="modal-header"> \
          <h3 class="modal-title">Edit Model</h3> \
        </div> \
        <div class="modal-body"> \
          <form role="form"> \
            <div class="form-group"> \
              <label for="slycat-model-name">Name</label> \
              <input id="slycat-model-name" class="form-control" type="text" data-bind="value:new_model_name"></input> \
            </div> \
            <div class="form-group"> \
              <label for="slycat-model-description">Description</label> \
              <textarea id="slycat-model-description" class="form-control" rows="3" data-bind="value:new_model_description"></textarea> \
            </div> \
          </form> \
        </div> \
        <div class="modal-footer"> \
          <button class="btn btn-danger pull-left" data-bind="click:delete_model">Delete Model</button> \
          <button class="btn btn-primary" data-bind="click:save_model_changes" data-dismiss="modal">Save Changes</button> \
          <button class="btn btn-warning" data-dismiss="modal">Cancel</button> \
        </div> \
      </div> \
    </div> \
  </div> \
</div> \
'

  });

}());

