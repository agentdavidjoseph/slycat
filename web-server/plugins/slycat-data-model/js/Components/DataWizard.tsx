'use strict';
import * as React from 'react';
import markings from "js/slycat-markings";
import client from "js/slycat-web-client";
import { createModel, CreateModelResponse} from "./wizard-utils.ts";
import {WizardModal, WizardModalProps} from "./WizardModal.tsx";
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
  private getWizardModalHeader = ():JSX.Element => {
    return (
      <React.Fragment>
        header
      </React.Fragment>
    )
  }
  private getWizardModalBody = ():JSX.Element => {
    return (
      <React.Fragment>
        body
      </React.Fragment>
    )
  }
  private getModalWizardFooter = ():JSX.Element => {
    return (
      <React.Fragment>
        footer
      </React.Fragment>
    )
  }
  private getWizardModalProps = (): WizardModalProps => {
    return {
      closeModal: ()=> client.delete_model_fetch({ mid: this.state.modelId }),
      header: this.getWizardModalHeader(),
      body: this.getWizardModalBody(),
      footer: this.getModalWizardFooter(),
      title: 'Data Wizard'
    }
  }
  // client.delete_model_fetch({ mid: this.state.modelId })
  render() {
    return (
      <WizardModal
        {...this.getWizardModalProps()}
      />
    );
  }
}
