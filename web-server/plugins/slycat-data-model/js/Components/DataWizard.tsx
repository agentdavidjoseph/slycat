'use strict';
import * as React from 'react';
import markings from "js/slycat-markings";
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
  private handleCreateModel = (): void => {
    createModel(this.props.projectId, 'data-model', '', '', markings.preselected())
      .then((response: CreateModelResponse) =>{
      this.setState({modelId: response.id});
    });
  };
  private createModelButton = (mid: string) : JSX.Element => {
    const createButton = (
      <React.Fragment>
        <button className="btn btn-primary" onClick={()=>this.handleCreateModel()}>
          create model
        </button>
      </React.Fragment>
    );
    return mid===''?createButton:null;
  }
  // client.delete_model_fetch({ mid: component.model._id() })
  render() {
    return (
    	<div className="justify-content-center mt-4">
        DataWizard init with PID {this.props.projectId}
        {this.createModelButton(this.state.modelId)}
      </div>
    );
  }
}
