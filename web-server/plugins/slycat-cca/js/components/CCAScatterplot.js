import React from "react";
import { connect } from 'react-redux';

import d3 from "d3";

import CCALegend from "./CCALegend";

class CCAScatterplot extends React.Component {
  constructor(props) 
  {
    super(props);

    // Create a ref to the .cca-barplot-table
    this.cca_scatterplot = React.createRef();
  }

  componentDidMount() 
  {
    this.prep();
  }

  componentDidUpdate(prevProps, prevState, snapshot) 
  {
    this.prep();
  }

  prep = () => {
    // We need v, so don't continue without it
    if(this.props.v === undefined){
      return;
    }

    // Cloning the selection array because we will be modifying it as a placeholder for updating state
    // ToDo, fix this, don't update the array, just update state.
    this.selection = this.props.selection.slice();

    this.start_drag = null;
    this.end_drag = null;

    // Getting context of main visible canvas
    this.main_canvas = this.cca_scatterplot.current;
    this.main_context = this.main_canvas.getContext("2d");

    // Creating a new data canvas and getting its context
    this.data_canvas = document.createElement("canvas");
    this.data_canvas.width = this.props.width;
    this.data_canvas.height = this.props.height;
    this.data_context = this.data_canvas.getContext("2d");

    // Creating a new selection canvas and getting its context
    this.selection_canvas = document.createElement("canvas");
    this.selection_canvas.width = this.props.width;
    this.selection_canvas.height = this.props.height;
    this.selection_context = this.selection_canvas.getContext("2d");

    this.update_indices();
    this.update_x();
    this.update_y();
    this.update_color_domain();
    this.render_data();
  }

  handle_mouse_down = (e) =>
  {
    // Prevents selecting text in legend when dragging
    e.preventDefault();
    this.start_drag = [this._offsetX(e), this._offsetY(e)];
    this.end_drag = null;
  }

  handle_mouse_move = (e) =>
  {
    if(this.start_drag) // Mouse is down ...
      {
        if(this.end_drag) // Already dragging ...
        {
          this.end_drag = [this._offsetX(e), this._offsetY(e)];

          var width = this.props.width;
          var height = this.props.height;

          this.main_context.clearRect(0, 0, width, height);
          this.main_context.drawImage(this.data_canvas, 0, 0);
          this.main_context.drawImage(this.selection_canvas, 0, 0);
          this.main_context.fillStyle = "rgba(255, 255, 0, 0.3)";
          this.main_context.fillRect(this.start_drag[0], this.start_drag[1], this.end_drag[0] - this.start_drag[0], this.end_drag[1] - this.start_drag[1]);
          this.main_context.strokeStyle = "rgb(255, 255, 0)";
          this.main_context.lineWidth = 2.0;
          this.main_context.strokeRect(this.start_drag[0], this.start_drag[1], this.end_drag[0] - this.start_drag[0], this.end_drag[1] - this.start_drag[1]);
        }
        else
        {
          if(Math.abs(this._offsetX(e) - this.start_drag[0]) > this.props.drag_threshold || Math.abs(this._offsetY(e) - this.start_drag[1]) > this.props.drag_threshold) // Start dragging ...
          {
            this.end_drag = [this._offsetX(e), this._offsetY(e)];
          }
        }
      }
  }

  handle_mouse_up = (e) =>
  {
    // Break out if the target was acutally inside the legend or the legend itself,
    // otherwise letting go of the legend after a drag deselects all selected scatterplot points by 
    // triggering this event.
    if(document.querySelector('#legend .legend').contains(e.target))
    {
      return;
    }

    console.log("e.target: " + e.target);
    console.log("e.currentTarget: " + e.currentTarget);
    if(!e.ctrlKey && !e.metaKey)
      this.selection = [];

    var x = this.props.x;
    var y = this.props.y;
    var count = x.length;

    if(this.start_drag && this.end_drag) // Rubber-band selection ...
    {
      var x1 = this.x_scale.invert(Math.min(this.start_drag[0], this.end_drag[0]));
      var y1 = this.y_scale.invert(Math.max(this.start_drag[1], this.end_drag[1]));
      var x2 = this.x_scale.invert(Math.max(this.start_drag[0], this.end_drag[0]));
      var y2 = this.y_scale.invert(Math.min(this.start_drag[1], this.end_drag[1]));

      for(var i = 0; i != count; ++i)
      {
        if(x1 <= x[i] && x[i] <= x2 && y1 <= y[i] && y[i] <= y2)
        {
          var index = this.selection.indexOf(this.props.indices[i]);
          if(index == -1)
            this.selection.push(this.props.indices[i]);
        }
      }
    }
    else // Pick selection ...
    {
      var x1 = this.x_scale.invert(this._offsetX(e) - this.props.pick_distance);
      var y1 = this.y_scale.invert(this._offsetY(e) + this.props.pick_distance);
      var x2 = this.x_scale.invert(this._offsetX(e) + this.props.pick_distance);
      var y2 = this.y_scale.invert(this._offsetY(e) - this.props.pick_distance);

      for(var i = count-1; i > -1; i--)
      {
        if(x1 <= x[i] && x[i] <= x2 && y1 <= y[i] && y[i] <= y2)
        {
          var index = this.selection.indexOf(this.props.indices[i]);
          if(index == -1)
            this.selection.push(this.props.indices[i]);
          else
            this.selection.splice(index, 1);

          break;
        }
      }
    }

    this.start_drag = null;
    this.end_drag = null;

    this.render_selection();
    // self.element.trigger("selection-changed", [self.options.selection]);
    // ToDo: update global state here with new selection
  }

  render_data = () =>
  {
    var width = this.main_canvas.width;
    var height = this.main_canvas.height;

    this.data_context.setTransform(1, 0, 0, 1, 0, 0);
    this.data_context.clearRect(0, 0, width, height);

    // Draw labels ...
    this.data_context.font = this.props.font_size + " " + this.props.font_family;
    this.data_context.textAlign = "center";
    this.data_context.fillStyle = "black";

    this.data_context.save();
    this.data_context.textBaseline = "alphabetic";
    this.data_context.translate(
      ((width - this.props.border.left - this.props.border.right) / 2) + this.props.border.left, 
      height - this.props.border.bottom + this.props.label_offset.x
    );
    this.data_context.fillText("Input Metavariable", 0, 0);
    this.data_context.restore();

    this.data_context.save();
    this.data_context.textBaseline = "top";
    this.data_context.translate(
      this.props.border.left - this.props.label_offset.y, 
      ((height - this.props.border.top - this.props.border.bottom) / 2) + this.props.border.top
    );
    this.data_context.rotate(-Math.PI / 2);
    this.data_context.fillText("Output Metavariable", 0, 0);
    this.data_context.restore();

    var count = this.props.x.length;
    var x = this.props.x;
    var y = this.props.y;
    var v = this.props.v;
    var indices = this.props.indices;
    var color = this.props.color;

    // Draw points using rectangles ...
    if(count < 50000)
    {
      var cx, cy,
       square_size = 8,
       border_width = 1,
       half_border_width = border_width / 2,
       fillWidth = square_size - (2 * border_width),
       fillHeight = fillWidth,
       strokeWidth = square_size - border_width,
       strokeHeight = strokeWidth;

      for(var i = 0; i != count; ++i)
      {
        cx = Math.round( this.x_scale(x[i]) - (square_size/2) - border_width );
        cy = Math.round( this.y_scale(y[i]) - (square_size/2) - border_width );
        this.data_context.fillStyle = color(v[indices[i]]);
        this.data_context.fillRect(cx + border_width, cy + border_width, fillWidth, fillHeight);
        this.data_context.strokeRect(cx + half_border_width, cy + half_border_width, strokeWidth, strokeHeight);
      }
    }
    // Draw points using tiny rectangles ...
    else
    {
      var size = 2;
      var offset = size / 2;
      for(var i = 0; i != count; ++i)
      {
        this.data_context.fillStyle = color(v[indices[i]]);
        this.data_context.fillRect(Math.round(this.x_scale(x[i]) - offset), Math.round(this.y_scale(y[i]) - offset), size, size);
      }
    }

    this.render_data_selection();
  }

  render_selection = () =>
  {
    var x = this.props.x;
    var y = this.props.y;
    var v = this.props.v;
    var color = this.props.color;
    var indices = this.props.indices;

    this.selection_context.setTransform(1, 0, 0, 1, 0, 0);
    this.selection_context.clearRect(0, 0, this.props.width, this.props.height);

    var selection = this.selection;
    var selection_count = selection.length;
    var cx, cy,
       square_size = 16,
       border_width = 2,
       half_border_width = border_width / 2,
       fillWidth = square_size - (2 * border_width),
       fillHeight = fillWidth,
       strokeWidth = square_size - border_width,
       strokeHeight = strokeWidth;

    this.selection_context.strokeStyle = "black";
    this.selection_context.lineWidth = border_width;

    for(var i = 0; i != selection_count; ++i)
    {
      var global_index = selection[i];
      var local_index = this.inverse_indices[global_index];
      this.selection_context.fillStyle = color(v[global_index]);
      cx = Math.round( this.x_scale(x[local_index]) - (square_size/2) - border_width );
      cy = Math.round( this.y_scale(y[local_index]) - (square_size/2) - border_width );
      this.selection_context.fillRect(cx + border_width, cy + border_width, fillWidth, fillHeight);
      this.selection_context.strokeRect(cx + half_border_width, cy + half_border_width, strokeWidth, strokeHeight);
    }

    this.render_data_selection();
  }

  render_data_selection = () =>
  {
    this.main_context.clearRect(0, 0, this.props.width, this.props.height);
    this.main_context.drawImage(this.data_canvas, 0, 0);
    this.main_context.drawImage(this.selection_canvas, 0, 0);
  }

  update_x = () =>
  {
    this.x_scale = d3.scale.linear().domain([d3.min(this.props.x), d3.max(this.props.x)]).range([0 + this.props.border.left, this.main_canvas.width - this.props.border.right]);
  }

  update_y = () =>
  {
    this.y_scale = d3.scale.linear().domain([d3.min(this.props.y), d3.max(this.props.y)]).range([this.main_canvas.height - this.props.border.bottom, 0 + this.props.border.top]);
  }

  update_color_domain = () =>
  {
    var v_min = d3.min(this.props.v);
    var v_max = d3.max(this.props.v);
    var domain = []
    var domain_scale = d3.scale.linear().domain([0, this.props.color.domain().length]).range([v_min, v_max]);
    for(var i in this.props.color.domain())
      domain.push(domain_scale(i));
    this.props.color.domain(domain);
  }

  update_indices = () =>
  {
    this.inverse_indices = {};
    var count = this.props.indices.length;
    for(var i = 0; i != count; ++i)
      this.inverse_indices[this.props.indices[i]] = i;
  }

  _offsetX = (e) =>
  {
    return e.pageX - e.currentTarget.getBoundingClientRect().left - $(document).scrollLeft();
  }

  _offsetY = (e) =>
  {
    return e.pageY - e.currentTarget.getBoundingClientRect().top - $(document).scrollTop();
  }

  resize_canvas = () =>
  {
    
  }

  render() {
    return (
      <React.Fragment>
        <React.StrictMode>
          <div 
            // This container div is necessary because event handlers must be attached to a parent of both 
            // the legend and the canvas, since the legend's svg element covers up the canvas element
            style={{width: '100%', height: '100%'}}
            onMouseDown={this.handle_mouse_down}
            onMouseMove={this.handle_mouse_move}
            onMouseUp={this.handle_mouse_up}
          >
            <CCALegend
              height={this.props.height - this.props.border.top - this.props.border.bottom}
              canvas_width={this.props.width} 
              canvas_height={this.props.height} 
              position={{
                x: this.props.width - this.props.border.left - this.props.border.right,
                y: this.props.border.top
              }}
            />
            <canvas id="scatterplot" 
              ref={this.cca_scatterplot} 
              width={this.props.width} 
              height={this.props.height} 
              style={{
                width: this.props.width + 'px', 
                height: this.props.height + 'px'
              }}
            />
          </div>
        </React.StrictMode>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  let v = state.derived.column_data[state.variable_selected] !== undefined ?
    state.derived.column_data[state.variable_selected].values :
    undefined;

  return {
    // colormap: state.colormap,
    // variable_selected: state.variable_selected,
    // variable_selected_label: state.derived.table_metadata["column-names"][state.variable_selected],
    // variable_selected_label: state.derived.variable_selected_label,
    // v_string: state.derived.table_metadata["column-types"][state.variable_selected]=="string",
    // v_string: state.derived.v_string,
    // scatterplot_font_family: state.scatterplot_font_family,
    // scatterplot_font_size: state.scatterplot_font_size,
    // gradient: slycat_color_maps.get_gradient_data(state.colormap),
    // cca_component_selected: state.cca_component_selected,
    // cca_component_sorted: state.cca_component_sorted,
    // cca_component_sort_direction: state.cca_component_sort_direction,
    v: v,
  }
};

export default connect(
  mapStateToProps,
  null
)(CCAScatterplot)
