import * as React from "react";
import ModalContent from "components/ModalContent.tsx";
import client from "js/slycat-web-client";
import SlycatFormRadioCheckbox from 'components/SlycatFormRadioCheckbox.tsx';
import SlycatFormTextBox from 'components/SlycatFormTextBox.tsx';
import SlycatFormDropDown from 'components/SlycatFormDropDown.tsx';
import SlycatRemoteControls from 'components/SlycatRemoteControls.jsx';
import ConnectButton from 'components/ConnectButton.tsx';
import RemoteFileBrowser from 'components/RemoteFileBrowser.tsx'

// import client from "../../js/slycat-web-client";

/**
 * not used
 */
export interface TimeseriesWizardProps {}

/**
 * not used
 */
export interface TimeseriesWizardState {}

/**
 * modal wizard for the timeseries model creation
 */

let initialState = {};

export default class TimeseriesWizard extends React.Component<
  TimeseriesWizardProps,
  TimeseriesWizardState
> {
  public constructor(props: TimeseriesWizardProps) {
    super(props);
    this.state = {
      project: this.props.project,
      model: {_id: ''},
      modalId: "slycat-wizard",
      visibleTab: '0',
      selectedOption: 'xyce',
      loadingData: false,
      hostname: '',
      sessionExists: null,
      username: '',
      password: '',
      file: [new File([""], "filename")],
      selectedPath: '',
      parserType: '',
      TimeSeriesLocalStorage: localStorage.getItem("slycat-timeseries-wizard") as any,
    };
    initialState = _.cloneDeep(this.state);
    this.create_model();
  }

  getBodyJsx(): JSX.Element {
    return (
      <div>
        <ul className="nav nav-pills">
        <li className={this.state.visibleTab == '0' ? 'nav-item active': 'nav-item'}><a className="nav-link">Find Data</a></li>
        <li className={this.state.visibleTab == '1' ? 'nav-item active': 'nav-item'}><a className="nav-link">Select Table File</a></li>
        <li className={this.state.visibleTab == '2' ? 'nav-item active': 'nav-item'}><a className="nav-link">Timeseries Parameters</a></li>
        <li className="nav-item"><a className="nav-link">Select Timeseries File</a></li>
        <li className="nav-item"><a className="nav-link">Select HDF5 Directory</a></li>
        <li className="nav-item"><a className="nav-link">HPC Parameters</a></li>
        <li className="nav-item"><a className="nav-link">Name Model</a></li>
      </ul>
        {this.state.visibleTab === "0" ?
          <div>
            <form className='ml-3'>
              <SlycatFormRadioCheckbox
                checked={this.state.selectedOption === 'xyce'}
                onChange={this.sourceSelect}
                value={'xyce'}
                text={'Xyce'}
              />
              <SlycatFormRadioCheckbox
                checked={this.state.selectedOption === 'csv'}
                onChange={this.sourceSelect}
                value={'csv'}
                text={'CSV'}
              />
              <SlycatFormRadioCheckbox
                checked={this.state.selectedOption === 'hdf5'}
                onChange={this.sourceSelect}
                value={'hdf5'}
                text={'HDF5'}
              />
            </form>
            <SlycatRemoteControls
            loadingData={this.state.loadingData} 
            callBack={this.controlsCallBack}
            showConnectButton={false}
            />
          </div>
        : null}
        {this.state.visibleTab === "1" ?
          <div>
            <RemoteFileBrowser 
              onSelectFileCallBack={this.onSelectFile}
              onSelectParserCallBack={this.onSelectParser}
              onReauthCallBack={this.onReauth}
              hostname={this.state.hostname} 
            />
          </div>
        : null}
        {this.state.visibleTab === "2" && this.state.selectedOption === 'csv' ?
          <div>
            <SlycatFormTextBox
              label={"Table File Delimeter"}
            />
            <SlycatFormDropDown
              label={"Timeseries Column Name"}
            />
          </div>
        : null}
        {this.state.visibleTab === "2" ?
          <div>
            <SlycatFormTextBox
              label={'Timeseries Bin Count'}
            />
            <SlycatFormDropDown
              label={'Resampling Algorithm'}
            />
            <SlycatFormDropDown
              label={'Cluster Linkage Measure'}
            />
          </div>
        : null}
      </div>
    );
  }

  getFooterJSX(): JSX.Element {
    let footerJSX = [];
    if(this.state.visibleTab != "0"){
      footerJSX.push(
      <button key={1} type='button' className='btn btn-light mr-auto' onClick={this.back}>
        Back
      </button>
      );
    }
    if(this.state.visibleTab == '0' && this.state.sessionExists != true) {
      // footerJSX.push(<button key={4} type='button' className='btn btn-primary' onClick={this.continue}>
      // Continue
      // </button>)
      footerJSX.push(
      <ConnectButton
        key={3}
        text='Continue'
        loadingData={this.state.loadingData}
        hostname = {this.state.hostname}
        username = {this.state.username}
        password = {this.state.password}
        callBack = {this.connectButtonCallBack}
      />);
    }
    else {
      footerJSX.push( 
        <button key={4} type='button' className='btn btn-primary' onClick={this.continue}>
        Continue
        </button>
      )
    }
    // return <div>footer</div>;
    return footerJSX;
  }

  continue = () =>
  {
    if (this.state.visibleTab === "0") {
      this.setState({visibleTab: "1"});
    }
    else if (this.state.visibleTab === "1") {
      this.setState({visibleTab: "2"});
    }
  };

  back = () => {
    if (this.state.visibleTab === "1") {
      this.setState({visibleTab: "0"});
    }
    else if (this.state.visibleTab === "2") {
      this.setState({visibleTab: "1"});
    }
    else if (this.state.visibleTab === "3")
    {
      this.setState({visibleTab: "2"});
    }
  }

  connectButtonCallBack = (sessionExists, loadingData) => {
    this.setState({
      sessionExists,
      loadingData,
      reauth: false,
    },()=>{
      if(this.state.sessionExists){
        this.continue();
      }
    });
  }

  controlsCallBack = (newHostname, newUsername, newPassword, sessionExists) => {
    this.setState({
      hostname: newHostname,
      sessionExists: sessionExists,
      username: newUsername,
      password: newPassword
    });
  };

  onReauth = () => {
    // Session has been lost, so update state to reflect this.
    this.setState({
      sessionExists: false,
      reauth: true,
    });
    // Switch to login controls
    this.setState({visible_tab: "2", selectedNameIndex: 1});
  }

  onSelectFile = (selectedPath, selectedPathType, file) => {
    // type is either 'd' for directory or 'f' for file

    if(selectedPathType === 'f') {
      this.setState({files:file, disabled:false, selected_path:selectedPath});
    }
    else {
      this.setState({disabled:true});
    }
    if(this.state.selectedOption === 'csv') {
      client.get_time_series_names({
        hostname: this.state.hostname,
        path: selectedPath,
        success: function(response) {
          console.log(response);
          // component.remote.progress_status("Finished");
          // component.remote.progress(100);
          // component.timeseries_names(JSON.parse(response))
          // component.tab(4);
        },
        error: function(request, status, reason_phrase) {
          console.log(status);
          // console.log(reason_phrase);
          // component.remote.progress_status("");
          // component.remote.progress(null);
          // dialog.dialog({message: "Please select a CSV file with a valid timeseries column."})();
        }
      });
    }
  }
  
  onSelectParser = (type) => {
    this.setState({parserType:type});
  }

  sourceSelect = (value) =>
  {
    this.setState({selectedOption: value});
  };

  cleanup = () => {
    this.setState(initialState);
    client.delete_model_fetch({ mid: this.state.model['id'] });
  };

  create_model = () => {
    client.post_project_models_fetch({
      pid: this.state.project._id(),
      type: 'timeseries',
      name: '',
      description: '',
      marking: '',
    }).then((result) => {
      this.setState({model: result});
    })
  };

  render() {
    return (
      <ModalContent
        modalId={this.state.modalId}
        closingCallBack={this.cleanup}
        title={"Timeseries Wizard"}
        body={this.getBodyJsx()}
        footer={this.getFooterJSX()}
      />
    );
  }
}
