/*
Copyright 2013, Sandia Corporation. Under the terms of Contract
DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains certain
rights in this software.
*/

define("slycat-local-browser", ["slycat-server-root", "slycat-web-client", "knockout"], function(server_root, client, ko)
{
  ko.components.register("slycat-local-browser",
  {
    viewModel: function(params)
    {
      var component = this;
      component.selection = params.selection;
      component.disabled = params.disabled === undefined ? false : params.disabled;
      component.selection_changed = function(model, event)
      {
        component.selection(event.target.files);
      }
    },
    template: { require: "text!" + server_root + "templates/slycat-local-browser.html" }
  });

});
