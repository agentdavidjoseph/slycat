'use strict';
import * as React from 'react';

/**
 */
export interface SlycatFormTextBoxProps {
  checked: boolean
  onChange: Function
  value: string
  text: string
  style: any
  label: string
}

/**
 * not used
 */
export interface SlycatFormTextBoxState {
}
/**
 * class that creates a a form with checkboxes
 * some other process
 */
export default class SlycatFormTextBox extends React.Component<SlycatFormTextBoxProps, SlycatFormTextBoxState> {
  /**
   * not used
   */
  public constructor(props:SlycatFormTextBoxProps) {
    super(props)
    this.state = {}
  }

  onValueChange = (value) => {
    // localStorage.setItem("slycat-remote-controls-username", value);
    this.setState({value: value});
  };

  public render () {
    return (
    <div className='form-group row mb-3'>
        <label className='col-sm-2 col-form-label'>{this.props.label}</label>
        <div className='col-sm-9'>
          <input
            className='form-control' type='text'
            value={this.state.value?this.state.value:""}
            onChange={(e)=>this.onValueChange(e.target.value)} />
        </div>
    </div>
    );
  }
}
