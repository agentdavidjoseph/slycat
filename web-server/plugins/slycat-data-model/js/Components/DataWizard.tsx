'use strict';
import * as React from 'react';
import markings from "js/slycat-markings";
import client from "js/slycat-web-client";
import { createModel, CreateModelResponse} from "./wizard-utils.ts";
import { WizardModal, WizardModalProps } from "./WizardModal.tsx";
import { DataWizardNavPills } from "./DataWizardNavPills.tsx";
import { LocalBrowser } from "./LocalBrowser.tsx";
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
  activeTab: number
  localData: boolean
  file: File
}
/**
 * class that creates a Navbar for use in tracking progress through say a wizard or
 * some other process
 */
export default class DataWizard extends React.Component<DataWizardProps, DataWizardState> {

  public constructor(props:DataWizardProps) {
    super(props)
    this.state = {
      modelId: '',
      activeTab: 0,
      localData: true,
      file: new File([""], "file_stub")
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
      </React.Fragment>
    )
  }
  private readFile = (f:any): void => {
    console.log(f);
    this.setState({file:f});
  }
  private previewFile = (): JSX.Element => {
    let f = this.state.file;
    let reader = new FileReader();
    reader.onload = function(e) {
      let fileDisplayArea = document.getElementById('fileDisplayArea');
      fileDisplayArea&&(fileDisplayArea.innerText = reader.result as any);
    }
    reader.readAsText(f);
    return (
      <React.Fragment>
        {f&&(<li>
          <strong>{f.name}</strong> 
          {`${f.type} - ${f.size} bytes`}
        </li>)}
        <div className="card col-3" style={{maxHeight: `200px`}}>
          <div className="card-header">Header</div>
          <div className="card-body overflow-auto vh-100">
            <pre id="fileDisplayArea"></pre>
          </div> 
          <div className="card-footer">Footer</div>
        </div>
      </React.Fragment>
    );
  }
  private getWizardModalBody = ():JSX.Element => {
    return (
      <React.Fragment>
        <DataWizardNavPills
          activeTab={this.state.activeTab}
        />
        <LocalBrowser
          readFile={(e:any)=>this.readFile(e.target.files[0])} 
        />
        {this.previewFile()}
        {/* <div className="tab-content">
          <div className="form-check">
            <label className="font-weight-bold">
              <input type="radio" name="local-or-remote-radios" id="local-radio" value="local"/>
              Local
            </label>
          </div>
          <div className="form-check">
            <label className="font-weight-bold">
              <input type="radio" name="local-or-remote-radios" id="remote-radio" value="remote"/>
              Remote
            </label>
          </div>
        </div> */}
          {/* <slycat-parser-controls params="parser:parser,category:'table'" data-bind="visible: ps_type() == 'server'"></slycat-parser-controls> */}
      </React.Fragment>
    )
  }
  private handleContinueButton = ():void => {
    this.setState({activeTab: 1})
  }
  private handleBackButton = ():void => {
    this.setState({activeTab: 0})
  }
  private handleFinishButton = ():void => {
    console.log("go to model")
  }
  private getModalWizardFooter = ():JSX.Element => {
    return this.state.activeTab===0?
      (
        <React.Fragment>
          <button className="btn btn-light mr-auto disabled">Back</button>
          <button className="btn btn-primary" onClick={() => this.handleContinueButton()}>Continue</button>
        </React.Fragment>
      ):
      (
        <React.Fragment>
          <button className="btn btn-light mr-auto" onClick={() => this.handleBackButton()}>Back</button>
          <button className="btn btn-primary" onClick={() => this.handleFinishButton()}>Finish</button>
        </React.Fragment>
      );
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
  render() {
    return (
      <WizardModal
        {...this.getWizardModalProps()}
      />
    );
  }
}