'use strict';
import * as React from 'react';

/**
 */
export interface SlycatNumberInputProps {
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
export interface SlycatNumberInputState {
}
/**
 * class that creates a a form with checkboxes
 * some other process
 */
export default class SlycatNumberInput extends React.Component<SlycatNumberInputProps, SlycatNumberInputState> {
  /**
   * not used
   */
  public constructor(props:SlycatNumberInputProps) {
    super(props)
    this.state = {
      value: props.value
    }
  }

  onValueChange = (value) => {
    // localStorage.setItem("slycat-remote-controls-username", value);
    this.setState({value: value});
    this.props.callBack(value);
  };

  public render () {
    return (
    <div className='form-group row mb-3'>
        <label className='col-sm-2 col-form-label'>{this.props.label}</label>
        <div className='col-sm-9'>
          <input
            className='form-control' type='number' min={2}
            value={this.state.value}
            onChange={(e)=>this.onValueChange(e.target.value)}
            />
        </div>
    </div>
    );
  }
}
