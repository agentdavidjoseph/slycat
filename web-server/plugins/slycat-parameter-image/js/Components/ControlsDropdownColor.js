// This is a copy of components/ControlsDropdownColor that uses internal state. It needs to be 
// switched out for components/ControlsDropdownColor when the Parameter Space model is converted
// to use Redux across the entire model.

import React from "react";
import ControlsDropdown from './ControlsDropdown';
import slycat_color_maps from "js/slycat-color-maps";

class ControlsDropdownColor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selection: this.props.dropdown[0].selected,
    };

    this.state[this.props.dropdown.state_label] = this.props.dropdown.selected;

    this.set_selected = this.set_selected.bind(this);
  }

  set_selected(state_label, key, trigger, e) {
    // Do nothing if the state hasn't changed (e.g., user clicked on currently selected variable)
    if(key == this.state[state_label])
    {
      return;
    }
    // That function will receive the previous state as the first argument, and the props at the time the update is applied as the
    // second argument. This format is favored because this.props and this.state may be updated asynchronously,
    // you should not rely on their values for calculating the next state.
    const obj = {};
    obj[state_label] = key;
    this.setState((prevState, props) => (obj));
    this.state.selection = key;

    // This is the legacy way of letting the rest of non-React components that the state changed. Remove once we are converted to React.
    this.props.element.trigger(trigger, key);
  }

  get_selected_colormap() {
    if(this.state.selection == null) {
      return "night";
    }
    else {
      return this.state.selection;
    }
  }

  render() {
    // Define default button style
    const button_style = 'btn-outline-dark';

    const colormaps = slycat_color_maps.color_maps;
    const items = Object.keys(colormaps).map((key, index) => {
      let colormap = colormaps[key];

      // Create CSS styles for rendering a preview of each colomap in the dropdown
      let gradient_data = slycat_color_maps.get_gradient_data(key);
      let color_stops = [];
      for (var i = 0; i < gradient_data.length; i++) {
          color_stops.push(gradient_data[i].color + " "
              + gradient_data[i].offset + "%");
      }
      let background_color = colormap.background;
      const width = 250;
      const right_margin = 5;
      const left_margin = 5;
      const right_left_padding = 10;
      const background_width = width - right_margin - left_margin - (2 * right_left_padding);
      const gradient_width = background_width - (2 * right_left_padding);
      let style = {
        backgroundImage: "linear-gradient(to left, "
            + color_stops.join(", ") + "), linear-gradient(to bottom, "
            + background_color + ", " + background_color + ")",
        backgroundSize: `${gradient_width}px 55%, ${background_width}px 100%`,
        backgroundPosition: `right ${right_margin + right_left_padding}px center, right ${right_margin}px center`,
        backgroundRepeat: "no-repeat, no-repeat",
        paddingRight: `${width}px`,
      }

      return {
        key: key,
        name: colormap.label,
        style: style,
      }
    });

    return (
      <ControlsDropdown 
        key={this.props.dropdown[0].id} 
        id={this.props.dropdown[0].id} 
        label={this.props.dropdown[0].label} 
        title={this.props.dropdown[0].title}
        state_label={this.props.dropdown[0].state_label} 
        trigger={this.props.dropdown[0].trigger}
        items={items}
        selected={this.state.selection} 
        single={this.props.dropdown[0].single} 
        set_selected={this.set_selected}
        button_style={button_style}
      />
    );
  }
}

export default ControlsDropdownColor
