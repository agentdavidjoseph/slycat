'use strict';
import * as React from 'react';

/**
 * nut used
 */
export interface DataUIProps { 
}

/**
 * not used
 */
export interface DataUIState {
}
/**
 * class that creates a Navbar for use in tracking progress through say a wizard or
 * some other process
 */
export default class DataUI extends React.Component<DataUIProps, DataUIState> {
  /**
   * not used
   */
  public constructor(props:DataUIProps) {
    super(props)
    this.state = {}
  }
  render() {
    return (
    	<div className="d-flex justify-content-center mt-4">
        DataUI init
      </div>
    );
  }
}
