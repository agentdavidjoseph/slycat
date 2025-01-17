// This is a copy of components/ControlsDropdown that uses internal state. It needs to be 
// switched out for components/ControlsDropdown when the Parameter Space model is converted
// to use Redux across the entire model.

import React from "react";

class ControlsDropdown extends React.Component {
  constructor(props) {
    super(props);
  }

  makeItem = (item, index) => {
    switch (item.type) 
    {
      case 'divider':
        return (
          <div className='dropdown-divider' key={`divider-${index}`} />
        );
      case 'header':
        return (
          <h6 className='dropdown-header' key={`header-${index}`}>{item.name}</h6>
        );
      default:
        return (
          <a 
            href='#' 
            key={item.key} 
            className={'dropdown-item' + (item.key == this.props.selected ? ' active' : '')}
            onClick={(e) => this.props.set_selected(this.props.state_label, item.key, this.props.trigger, e)}
            style={item.style}
          >
            {item.name}
          </a>
        );
    }

  }

  render() {
    let optionItems = this.props.items.map((item, index) => this.makeItem(item, index));

    let dropdown = 
      (<React.Fragment>
        <button type='button' id={this.props.id} data-toggle='dropdown' aria-haspopup='true' aria-expanded='false' 
          className={`btn dropdown-toggle btn-sm ${this.props.button_style}`}
          title={this.props.title}
        >
          {this.props.label}&nbsp;
        </button>
        <div className='dropdown-menu' aria-labelledby={this.props.id}>
          {optionItems}
        </div>
      </React.Fragment>);

    return (
      <React.Fragment>
      {this.props.single != true ? (
        <div className='btn-group'>
          {dropdown}
        </div>
      ) : (
        <React.Fragment>
        {dropdown}
        </React.Fragment>
      )}
      </React.Fragment>
    );
  }
}

export default ControlsDropdown