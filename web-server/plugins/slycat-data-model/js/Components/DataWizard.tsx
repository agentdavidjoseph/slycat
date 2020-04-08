'use strict';
import * as React from 'react';
import markings from "js/slycat-markings";
import client from "js/slycat-web-client";
import { createModel, CreateModelResponse}from "./wizard-utils.ts";
/**
 * nut used
 */
export interface DataWizardProps {
  projectId: string
}

/**
 * not used
 */
export interface DataWizardState {
  modelId: string
}
/**
 * class that creates a Navbar for use in tracking progress through say a wizard or
 * some other process
 */
export default class DataWizard extends React.Component<DataWizardProps, DataWizardState> {
  /**
   * not used
   */
  public constructor(props:DataWizardProps) {
    super(props)
    this.state = {
      modelId: ''
    }
  }

  componentDidMount() {
    console.log(`called componentDidMount ${JSON.stringify(this.state)}`);
    if(this.state.modelId === ''){
        createModel(this.props.projectId, 'data-model', '', '', markings.preselected())
        .then((response: CreateModelResponse) =>{
        this.setState({modelId: response.id});
      });
    }
  }

  componentWillUnmount() {
    console.log("called componentWillUnmount");
    if(this.state.modelId !== ''){
      client.delete_model_fetch({ mid: this.state.modelId })
      .then(()=>this.setState({modelId: ''}));
    }
  }

  // client.delete_model_fetch({ mid: component.model._id() })
  render() {
    return (
    	<div className="justify-content-center mt-4">
        DataWizard init with PID {this.props.projectId}
      </div>
    );
  }
}
