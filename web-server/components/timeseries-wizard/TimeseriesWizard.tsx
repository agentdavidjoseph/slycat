import * as React from "react";
import ModalContent from "components/ModalContent.tsx";
import client from "js/slycat-web-client";
import SlycatFormRadioCheckbox from 'components/SlycatFormRadioCheckbox.tsx';
import SlycatNumberInput from 'components/SlycatNumberInput.tsx';
import SlycatTextInput from 'components/SlycatTextInput.tsx';
import SlycatFormDropDown from 'components/SlycatFormDropDown.tsx';
import SlycatTimeInput from 'components/SlycatTimeInput.tsx';
import SlycatRemoteControls from 'components/SlycatRemoteControls.jsx';
import ConnectButton from 'components/ConnectButton.tsx';
import RemoteFileBrowser from 'components/RemoteFileBrowser.tsx'
import SlycatSelector from 'components/SlycatSelector.tsx';

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
      tableFile: [new File([""], "filename")],
      timeseriesFile: [new File([""], "filename")],
      hdf5Directory: '',
      selectedPath: '',
      parserType: '',
      columnNames: null,
      binCount: 500,
      resamplingAlg: 'uniform-paa',
      clusterLinkageMeasure: 'average',
      accountId: '',
      partition: '',
      numNodes: 1,
      cores: 2,
      jobHours: 0,
      jobMin: 30,
      workDir: '',
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
          {this.state.selectedOption != 'hdf5' ?
          <li className={this.state.visibleTab == '1' ? 'nav-item active': 'nav-item'}><a className="nav-link">Select Table File</a></li>
          : null}
          <li className={this.state.visibleTab == '2' ? 'nav-item active': 'nav-item'}><a className="nav-link">Timeseries Parameters</a></li>
          {this.state.selectedOption == 'xyce' ? 
          <li className={this.state.visibleTab == '3' ? 'nav-item active': 'nav-item'}><a className="nav-link">Select Timeseries File</a></li>
          : null}
          {this.state.selectedOption == 'hdf5' ? 
          <li className={this.state.visibleTab == '4' ? 'nav-item active': 'nav-item'}><a className="nav-link">Select HDF5 Directory</a></li>
          : null}
          <li className={this.state.visibleTab == '5' ? 'nav-item active': 'nav-item'}><a className="nav-link">HPC Parameters</a></li>
          <li className={this.state.visibleTab == '6' ? 'nav-item active': 'nav-item'}><a className="nav-link">Name Model</a></li>
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
              onSelectFileCallBack={this.onSelectTableFile}
              onSelectParserCallBack={this.onSelectParser}
              onReauthCallBack={this.onReauth}
              hostname={this.state.hostname} 
            />
          </div>
        : null}
        {this.state.visibleTab === "2" && this.state.selectedOption === 'csv' ?
          <div>
            <SlycatTextInput
              label={"Table File Delimeter"}
              value={','}
            />
            <SlycatSelector
              onSelectCallBack={this.props.onSelectParserCallBack}
              label={'Timeseries Column Name'}
              options={this.state.columnNames}
            />
          </div>
        : null}
        {this.state.visibleTab === "2" ?
          <div>
            <SlycatNumberInput
              label={'Timeseries Bin Count'}
              value={500}
              callBack={this.onSelectTimeseriesBinCount}
            />
            <SlycatSelector
              label={'Resampling Algorithm'}
              options={[{'text':'uniform piecewise aggregate approximation', 'value':'uniform-paa'}, 
              {'text':'uniform piecewise linear approximation', 'value':'uniform-pla'}]}
              onSelectCallBack={this.onSelectResamplingAlg}
            />
            <SlycatSelector
              label={'Cluster Linkage Measure'}
              options={[{'text':'average: Unweighted Pair Group Method with Arithmetic Mean (UPGMA) Algorithm', 'value':'average'},
              {'text':'single: Nearest Point Algorithm', 'value':'single'},
              {'text':'complete: Farthest Point Algorithm', 'value':'complete'},
              {'text':'weighted: Weighted Pair Group Method with Arithmetic Mean (WPGMA) Algorithm','value':'weighted'}]}
              onSelectCallBack={this.onSelectClusterLinkageMeasure}
            />
          </div>
        : null}
        {this.state.visibleTab === "3" ? 
          <div>
            <RemoteFileBrowser 
            onSelectFileCallBack={this.onSelectTimeseriesFile}
            onSelectParserCallBack={this.onSelectParser}
            onReauthCallBack={this.onReauth}
            hostname={this.state.hostname} 
            />
          </div>
        : null}
        {this.state.visibleTab === "4" ? 
          <div>
            <RemoteFileBrowser 
            onSelectFileCallBack={this.onSelectHDF5Directory}
            onSelectParserCallBack={this.onSelectParser}
            onReauthCallBack={this.onReauth}
            hostname={this.state.hostname} 
            />
          </div>
        : null}
        {this.state.visibleTab === "5" ? 
          <div>
            <SlycatTextInput
              label={"Account ID"}
              value={''}
              callBack={this.onSelectAccountId}
            />
            <SlycatTextInput
              label={"Partition/Queue"}
              value={''}
              callBack={this.onSelectPartition}
            /> 
            <SlycatNumberInput
              label={'Number of nodes'}
              value={1}
              callBack={this.onSelectNumNodes}
            /> 
            <SlycatNumberInput
              label={'Cores'}
              value={2}
              callBack={this.onSelectCores}
            />
            <SlycatTimeInput
              label={'Requested Job Time'}
              hours={0}
              minutes={30}
              minCallBack={this.onSelectJobMinutes}
              hourCallBack={this.onSelectJobHours}
            />
            <SlycatTextInput
              label={"Working Directory"}
              value={''}
              callBack={this.onSelectWorkDir}
            />                      
          </div>
        : null}
        {this.state.visibleTab === "6" ? 
          <div>
            <SlycatTextInput
              label={"Name"}
              value={''}
            />
            <SlycatTextInput
              label={"Description"}
              value={''}
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
    if (this.state.visibleTab === '0' && this.state.selectedOption != 'hdf5') {
      this.setState({visibleTab: '1'});
    }
    else if (this.state.visibleTab === '0' && this.state.selectedOption == 'hdf5') {
      this.setState({visibleTab: '2'});
    }
    else if (this.state.visibleTab === '1') {
      this.setState({visibleTab: '2'});
    }
    else if (this.state.visibleTab === '2' && this.state.selectedOption == 'xyce') {
      this.setState({visibleTab: '3'});
    }
    else if (this.state.visibleTab === '2' && this.state.selectedOption == 'csv') {
      this.setState({visibleTab: '5'});
    }
    else if (this.state.visibleTab === '2' && this.state.selectedOption == 'hdf5') {
      this.setState({visibleTab: '4'});
    }
    else if (this.state.visibleTab === '3') {
      this.setState({visibleTab: '5'});
    }
    else if (this.state.visibleTab === '4') {
      this.setState({visibleTab: '5'});
    }
    else if (this.state.visibleTab === '5') {
      this.setState({visibleTab: '6'});
    }
  };

  back = () => {
    if (this.state.visibleTab === '1') {
      this.setState({visibleTab: '0'});
    }
    else if (this.state.visibleTab === '2' && this.state.selectedOption != 'hdf5') {
      this.setState({visibleTab: '1'});
    }
    else if (this.state.visibleTab === '2' && this.state.selectedOption == 'hdf5') {
      this.setState({visibleTab: '0'});
    }
    else if (this.state.visibleTab === '3') {
      this.setState({visibleTab: '2'});
    }
    else if (this.state.visibleTab === '4') {
      this.setState({visibleTab: '2'});
    }
    else if (this.state.visibleTab === '5' && this.state.selectedOption == 'xyce') {
      this.setState({visibleTab: '3'});
    }
    else if (this.state.visibleTab === '5' && this.state.selectedOption == 'csv') {
      this.setState({visibleTab: '2'});
    }
    else if (this.state.visibleTab === '5' && this.state.selectedOption == 'hdf5') {
      this.setState({visibleTab: '4'});
    }
    else if (this.state.visibleTab === '6') {
      this.setState({visibleTab: '5'});
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

  onSelectTableFile = (selectedPath, selectedPathType, file) => {
    // type is either 'd' for directory or 'f' for file

    if(selectedPathType === 'f') {
      this.setState({tableFile:file, disabled:false, selected_path:selectedPath});
    }
    else {
      this.setState({disabled:true});
    }
    if(this.state.selectedOption === 'csv') {
      client.get_time_series_names_fetch({
        hostname: this.state.hostname,
        path: selectedPath,
      }).then((result) => {
        this.handleColumnNames(result);
        // this.setState({columnNames:result});
      })
    }
  }


  onSelectTimeseriesFile = (selectedPath, selectedPathType, file) => {
    // type is either 'd' for directory or 'f' for file

    if(selectedPathType === 'f') {
      this.setState({timeseriesFile:file, disabled:false, selected_path:selectedPath});
    }
    else {
      this.setState({disabled:true});
    }
  }

  onSelectTimeseriesBinCount = (count) => {
    this.setState({binCount: count});
  }

  onSelectResamplingAlg = (alg) => {
    this.setState({resamplingAlg: alg});
  }

  onSelectClusterLinkageMeasure = (clusterLinkage) => {
    this.setState({clusterLinkageMeasure: clusterLinkage});
  }

  onSelectAccountId = (id) => {
    this.setState({accountId: id});
  }

  onSelectPartition = (part) => {
    this.setState({partition: part});
  }

  onSelectNumNodes = (num) => {
    this.setState({numNodes: num});
  }

  onSelectCores = (numCores) => {
    this.setState({cores: numCores});
  }

  onSelectJobHours = (hours) => {
    this.setState({jobHours: hours});
  }

  onSelectJobMinutes = (mins) => {
    this.setState({jobMin: mins});
  }

  onSelectWorkDir = (dir) => {
    this.setState({workDir: dir});
  }

  onSelectHDF5Directory = (selectedPath, selectedPathType, file) => {
    if(selectedPathType === 'd') {
      this.setState({hdf5Directory:selectedPath, disabled:false, selected_path:selectedPath});
    }
    else {
      this.setState({disabled:true});
    }
  }
  
  handleColumnNames = (names) => {
    const columnNames = [];
    for(let i = 0; i < names.length; i++) {
      columnNames.push({text:names[i], value:names[i]});
    }
    this.setState({columnNames:columnNames});
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
