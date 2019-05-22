'use strict';
import React, { Component } from 'react';
import RemoteFileBrowser from 'components/RemoteFileBrowser.tsx'
import ProgressBar from 'components/ProgressBar';
import ControlsButton from './controls-button';
import '../../css/controls-button-var-options.css';
import { FileSelector } from './file-selector';
import client from "js/slycat-web-client";
import fileUploader from "js/slycat-file-uploader-factory";
import SlycatRemoteControls from 'components/SlycatRemoteControls.jsx';
import ConnectButton from 'components/ConnectButton.tsx';
import NavBar from 'components/NavBar.tsx';

let initialState={};
const localNavBar = ['Locate Data', 'Upload Table'];
const remoteNavBar = ['Locate Data', 'Choose Host', 'Select Table'];
export default class ControlsButtonUpdateTable extends Component {
  constructor(props) {
      super(props);
      this.state = {
          modalId: "varUpdateTableModal",
          title: "Update Table",
          files: [new File([""], "filename")],
          disabled: true,
          progressBarHidden: true,
          progressBarProgress: 0,
          hostname: "",
          username: "",
          password: "",
          selectedOption: "local",
          visible_tab: "0",
          sessionExists: null,
          selected_path: "",
          loadingData: false,
          selectedNameIndex: 0,
          parserType: "slycat-csv-parser"
      }
      initialState = {...this.state};
  }

  cleanup = () =>
  {
    this.setState(initialState);
  };

  closeModal = (e) =>
  {
    this.cleanup();
    $('#' + this.state.modalId).modal('hide');
  };

  continue = () =>
  {
    if (this.state.visible_tab === "0" && this.state.selectedOption === "local")
    {
      this.setState({visible_tab: "1", selectedNameIndex: 1});
    }
    else if (this.state.visible_tab === "0" && this.state.selectedOption === "remote")
    {
      this.setState({visible_tab: "2", selectedNameIndex: 1});
    }
    else if (this.state.visible_tab === "2")
    {
      this.setState({visible_tab: "3", selectedNameIndex: 2});
    }
  };

  back = () => {
    if (this.state.visible_tab === "1") {
      this.setState({visible_tab: "0", selectedNameIndex: 0});
    }
    else if (this.state.visible_tab === "2") {
      this.setState({visible_tab: "0", selectedNameIndex: 0});
    }
    else if (this.state.visible_tab === "3")
    {
      this.setState({visible_tab: "2", selectedNameIndex: 1});
    }
  }

  handleFileSelection = (selectorFiles) =>
  {
    this.setState({files:selectorFiles,disabled:false});
  };
  callBack = (newHostname, newUsername, newPassword, sessionExists) => {
      this.setState({
        hostname: newHostname,
        sessionExists: sessionExists,
        username: newUsername,
        password: newPassword
      });
  };
  sourceSelect = (e) =>
  {
      this.setState({selectedOption:e.target.value});
  };

  uploadFile = () =>
  {
    if (this.state.selectedOption == "local") {
      this.uploadLocalFile();
    }
    else {
      this.uploadRemoteFile();
    }
  }

  uploadLocalFile = () =>
  {
    let mid = this.props.mid;
    let pid = this.props.pid;
    this.setState({progressBarHidden:false,disabled:true});

    client.get_model_command_fetch({mid:mid, type:"parameter-image",command: "delete-table"})
        .then((json)=>{
            this.setState({progressBarProgress:33});
            let file = this.state.files[0];
            let fileObject ={
             pid: pid,
             mid: mid,
             file: file,
             aids: [["data-table"], file.name],
             parser: this.state.parserType,
             success: () => {
                   this.setState({progressBarProgress:75});
                   client.post_sensitive_model_command_fetch(
                    {
                        mid:mid,
                        type:"parameter-image",
                        command: "update-table",
                        parameters: {
                          linked_models: json["linked_models"],
                        },
                    }).then(() => {
                        this.setState({progressBarProgress:100});
                        this.closeModal();
                        location.reload();
                    });
                }
            };
            fileUploader.uploadFile(fileObject);
        });
  };

  uploadRemoteFile = () => {
    let mid = this.props.mid;
    let pid = this.props.pid;
    this.setState({progressBarHidden:false,disabled:true});

    client.get_model_command_fetch({mid:mid, type:"parameter-image",command: "delete-table"})
        .then((json)=>{
            this.setState({progressBarProgress:33});
            let file = this.state.files;
            const file_name = file.name;
            let fileObject ={
             pid: pid,
             hostname: this.state.hostname,
             mid: mid,
             paths: this.state.selected_path,
             aids: [["data-table"], file_name],
             parser: this.state.parserType,
             progress_final: 90,
             success: () => {
                   this.setState({progressBarProgress:75});
                   client.post_sensitive_model_command_fetch(
                    {
                        mid:mid,
                        type:"parameter-image",
                        command: "update-table",
                        parameters: {
                          linked_models: json["linked_models"],
                        },
                    }).then(() => {
                        this.setState({progressBarProgress:100});
                        this.closeModal();
                        location.reload();
                    });
                }
            };
            fileUploader.uploadFile(fileObject);
        });
  }

  onSelectFile = (selectedPath, selectedPathType, file) => {
    // this.state.selectedPath, this.state.selectedPathType
    // type is either 'd' for directory or 'f' for file
    if(selectedPathType === 'f') {
      this.setState({files:file, disabled:false, selected_path:selectedPath});
    }
    else {
      this.setState({disabled:true});
    }
  }

  onSelectParser = (type) => {
    console.log(type);
    this.setState({parserType:type});
  }

  connectButtonCallBack = (sessionExistsNew, loadingDataNew) => {
    this.setState({
      sessionExists: sessionExistsNew,
      loadingData: loadingDataNew
    },()=>{
      console.log(`updating with ${this.state.sessionExists}`)
      if(this.state.sessionExists){
        console.log('calling continue')
        this.continue();
      }
    });
  }

  getFooterJSX = () => {
    let footerJSX = [];
    if(this.state.visible_tab != "0"){
      footerJSX.push(
      <button key={1} type='button' className='btn btn-light mr-auto' onClick={this.back}>
        Back
      </button>
      );
    }
    if (this.state.visible_tab === "1" || this.state.visible_tab === "3") {
      footerJSX.push(
        <button key={2} type='button' disabled={this.state.disabled} className='btn btn-danger' onClick={this.uploadFile}>
        Update Data Table
        </button>
      );
    }
    if (this.state.sessionExists != true && this.state.visible_tab === "2") { 
      footerJSX.push(            
        <ConnectButton
          key={3}
          text="Continue"
          loadingData={this.state.loadingData}
          hostname = {this.state.hostname}
          username = {this.state.username}
          password = {this.state.password}
          callBack = {this.connectButtonCallBack}
        />
      );
    } else if (this.state.visible_tab != "1" && this.state.visible_tab != "3") {
      footerJSX.push( 
        <button key={4} type='button' className='btn btn-primary' onClick={this.continue}>
        Continue
        </button>
      )
    }
    return footerJSX;
  }
  render() {
    return (
      <div>
        <div className='modal fade' data-backdrop='false' id={this.state.modalId}>
          <div className='modal-dialog modal-lg'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h3 className='modal-title'>{this.state.title}</h3>
                <button type='button' className='close' onClick={this.closeModal} aria-label='Close'>
                  X
                </button>
              </div>

              <div className='modal-body' id="slycat-wizard">
                {this.state.selectedOption==='local'?
                <NavBar navNames ={localNavBar} selectedNameIndex={this.state.selectedNameIndex} />:
                <NavBar navNames ={remoteNavBar} selectedNameIndex={this.state.selectedNameIndex} />}
                {this.state.visible_tab === "0" ?
                  <form style={{marginLeft: '16px'}}>
                    <div className="form-check">
                      <label className="form-check-label" style={{marginRight: '92%'}} htmlFor="radio1">
                        <input type="radio" className="form-check-input" value='local' checked={this.state.selectedOption === 'local'} onChange={this.sourceSelect}/>Local
                      </label>
                    </div>
                    <div className="form-check">
                      <label className="form-check-label" style={{marginRight: '89.7%'}} htmlFor="radio2">
                        <input type="radio" className="form-check-input" value='remote' checked={this.state.selectedOption === 'remote'} onChange={this.sourceSelect}/>Remote
                      </label>
                    </div>
                  </form>
                :null}

                {this.state.visible_tab === "1"?
                <div className='tab-content'>
                  <div className="form-horizontal">
                      <FileSelector handleChange = {this.handleFileSelection} />
                    <div className="form-group row">
                      <label className="col-sm-1 col-form-label">
                        Filetype
                      </label>
                      <div className="col-sm-10">
                        <select className="form-control" onChange={(e)=>this.onSelectParser(e.target.value)}>
                        <option value="slycat-csv-parser">Comma separated values (CSV)</option>
                        <option value="slycat-dakota-parser">Dakota tabular</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>:null}

                {this.state.visible_tab === "2"?
                 <SlycatRemoteControls loadingData={this.state.loadingData} callBack={this.callBack}/>
                :null}

                <div className='slycat-progress-bar'>
                  <ProgressBar
                    hidden={this.state.progressBarHidden}
                    progress={this.state.progressBarProgress}
                  />
                </div>

                {this.state.visible_tab === "3" ?
                    <RemoteFileBrowser 
                    onSelectFileCallBack={this.onSelectFile}
                    onSelectParserCallBack={this.onSelectParser}
                    hostname={this.state.hostname} 
                    />:
                null}

                <div className='modal-footer'>
                  {this.getFooterJSX()}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ControlsButton label='Update Table' title={this.state.title} data_toggle='modal' data_target={'#' + this.state.modalId}
                        button_style={this.props.button_style} id='controls-button-death' />
      </div>
    );
  }
}