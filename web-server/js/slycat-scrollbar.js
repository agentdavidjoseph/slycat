/*
Copyright 2013, Sandia Corporation. Under the terms of Contract
DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains certain
rights in this software.
*/

require(["slycat-server-root", "knockout", "knockout-mapping"], function(server_root, ko, mapping)
{
  ko.components.register("slycat-scrollbar",
  {
    viewModel: function(params)
    {
      var scrollbar = this;
      scrollbar.axis = ko.unwrap(params.axis) || "vertical";
      scrollbar.length = params.length || ko.observable(500);
      scrollbar.thumb =
      {
        length: params.thumb_length || ko.observable(scrollbar.length() * 0.1),
        dragging: params.dragging || ko.observable(false),
        last_drag: null,
      };
      scrollbar.domain =
      {
        min: params.domain_min || ko.observable(0),
        value: params.domain_value || ko.observable(0.5),
        max: params.domain_max || ko.observable(1),
      };
      scrollbar.range =
      {
        min: ko.observable(0),
      };
      scrollbar.range.max = ko.pureComputed(function()
      {
        return scrollbar.length() - scrollbar.thumb.length();
      });
      scrollbar.range.value = ko.pureComputed(function()
      {
        return (scrollbar.domain.value() - scrollbar.domain.min()) / (scrollbar.domain.max() - scrollbar.domain.min()) * (scrollbar.range.max() - scrollbar.range.min() + scrollbar.range.min());
      });
      scrollbar.css = ko.pureComputed(function()
      {
        return scrollbar.axis + (scrollbar.thumb.dragging() ? " dragging" : "");
      });
      scrollbar.style = ko.pureComputed(function()
      {
        var result = {};
        result[scrollbar.axis == "vertical" ? "height" : "width"] = scrollbar.length() + "px";
        return result;
      });
      scrollbar.thumb.style = ko.pureComputed(function()
      {
        var result = {};
        result[scrollbar.axis == "vertical" ? "height" : "width"] = scrollbar.thumb.length() + "px";
        result[scrollbar.axis == "vertical" ? "top" : "left"] = scrollbar.range.value() + "px";
        return result;
      });
      scrollbar.thumb.mousedown = function(model, event)
      {
        scrollbar.thumb.dragging(true);
        scrollbar.thumb.last_drag = [event.screenX, event.screenY];
        window.addEventListener("mousemove", scrollbar.thumb.mousemove, true);
        window.addEventListener("mouseup", scrollbar.thumb.mouseup, true);
      }
      scrollbar.thumb.mousemove = function(event)
      {
        var new_range;
        if(scrollbar.axis == "vertical")
          new_range = scrollbar.range.value() + event.screenY - scrollbar.thumb.last_drag[1];
        else
          new_range = scrollbar.range.value() + event.screenX - scrollbar.thumb.last_drag[0];
        var new_value = (new_range - scrollbar.range.min()) / (scrollbar.range.max() - scrollbar.range.min()) * (scrollbar.domain.max() - scrollbar.domain.min()) + scrollbar.domain.min();

        scrollbar.domain.value(Math.max(scrollbar.domain.min(), Math.min(scrollbar.domain.max(), new_value)));
        scrollbar.thumb.last_drag = [event.screenX, event.screenY];
      }
      scrollbar.thumb.mouseup = function(event)
      {
        scrollbar.thumb.dragging(false);
        window.removeEventListener("mousemove", scrollbar.thumb.mousemove, true);
        window.removeEventListener("mouseup", scrollbar.thumb.mouseup, true);
      }
    },
    template: { require: "text!" + server_root + "templates/slycat-scrollbar.html" }
  });
});