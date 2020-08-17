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
      clusterMetric: 'euclidean',
      accountId: '',
      partition: '',
      numNodes: 1,
      cores: 2,
      jobHours: 0,
      jobMin: 30,
      workDir: '',
      userConfig: {'slurm': {}, 'timeseries-wizard': {}},
      idCol: '%eval_id',
      delimiter: ',',
      timeseriesName: 'TEST',
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
      this.compute();
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

  compute = () => {

    let userConfig = {"slurm": {}, "timeseries-wizard": {}};
    userConfig["slurm"]["wcid"] = this.state.accountId;
    userConfig["slurm"]["partition"] = this.state.partition;
    userConfig["slurm"]["workdir"] = this.state.workDir;
    userConfig["slurm"]["time-hours"] = this.state.jobHours;
    userConfig["slurm"]["time-minutes"] = this.state.jobMin;
    userConfig["slurm"]["nnodes"] = this.state.numNodes;
    userConfig["slurm"]["ntasks-per-node"] = this.state.cores;
    userConfig["timeseries-wizard"]["id-column"] = this.state.idCol;
    userConfig["timeseries-wizard"]["inputs-file-delimiter"] = this.state.delimiter;
    userConfig["timeseries-wizard"]["timeseries-name"] = this.state.timeseriesName;

    client.set_user_config({
      hostname: this.state.hostname,
      config: userConfig,
      success: function(response) { },
      error: function(request, status, reason_phrase) {
        console.log(reason_phrase);
      }
    });

    this.on_slycat_fn();
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

  generateUniqueId = () => {
    var d = Date.now();
    var uid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
    });

    return uid;
  };

  on_slycat_fn = () => {
    let agent_function = 'timeseries-model';
    let uid = this.generateUniqueId();

    let fn_params = {
      'timeseries_type': this.state.selected_option, 
      'inputs_file': this.state.tableFile, 
      'input_directory': this.state.selectedPath,
      'id_column': this.state.idCol, 
      'inputs_file_delimiter': this.state.delimiter, 
      'xyce_timeseries_file': this.state.timeseriesFile, 
      'timeseries_name': this.state.timeseriesName, 
      'cluster_sample_count': this.state.binCount, 
      'cluster_sample_type': this.state.resamplingAlg, 
      'cluster_type': this.state.clusterLinkageMeasure, 
      'cluster_metric': this.state.clusterMetric, 
      'workdir': this.state.workDir,
      'hdf5_directory': this.state.hdf5Directory,
      'retain_hdf5': true
    }

    var fn_params_copy = $.extend(true, {}, fn_params);

    if(fn_params.timeseries_type !== 'csv')
    {
      // Blank out timeseries_name
      fn_params_copy.timeseries_name = "";

    }
    
    var json_payload =
    {
      "scripts": [
      ],
      "hpc": {
          "is_hpc_job": true,
          "parameters": {
              "wckey" : this.state.accountId,
              "nnodes" : this.state.numNodes,
              "partition" : this.state.partition,
              "ntasks_per_node" : this.state.cores,
              "time_hours" : this.state.jobHours,
              "time_minutes" : this.state.jobMin,
              "time_seconds" : 0,
              "working_dir" : fn_params.workdir + "/slycat/"
          }
      }
    };

    var hdf5_dir = fn_params.workdir + "/slycat/" + uid + "/" + "hdf5/";
    var pickle_dir = fn_params.workdir + "/slycat/" + uid + "/" + "pickle/";

    if (fn_params.timeseries_type === "csv")
    {
      json_payload.scripts.push({
          "name": "timeseries_to_hdf5",
          "parameters": [
              {
                  "name": "--output-directory",
                  "value": hdf5_dir
              },
              {
                  "name": "--id-column",
                  "value": fn_params.id_column
              },
              {
                  "name": "--inputs-file",
                  "value": fn_params.inputs_file
              },
              {
                  "name": "--inputs-file-delimiter",
                  "value": fn_params.inputs_file_delimiter
              },
              {
                  "name": "--force",
                  "value": ""
              }
          ]
      });
    }
    else if(fn_params.timeseries_type === "xyce")
    {
      json_payload.scripts.push({
          "name": "xyce_timeseries_to_hdf5",
          "parameters": [
              {
                  "name": "--output-directory",
                  "value": hdf5_dir
              },
              {
                  "name": "--id-column",
                  "value": fn_params.id_column
              },
              {
                  "name": "--timeseries-file",
                  "value": fn_params.xyce_timeseries_file
              },
              {
                  "name": "--input-directory",
                  "value": fn_params.input_directory
              },
              {
                  "name": "--force",
                  "value": ""
              }
          ]
      });
    }
        // # check if we have a pre-set hdf5 directory
        // if "hdf5_directory" in params and params["hdf5_directory"] != "":
        //     hdf5_dir = params["hdf5_directory"]

    if (fn_params.timeseries_type === "csv")
    {
      json_payload.scripts.push({
          "name": "compute_timeseries",
          "parameters": [
              {
                  "name": "--directory",
                  "value": hdf5_dir
              },
              {
                  "name": "--timeseries-name",
                  "value": fn_params.timeseries_name
              },
              {
                  "name": "--cluster-sample-count",
                  "value": fn_params.cluster_sample_count
              },
              {
                  "name": "--cluster-sample-type",
                  "value": fn_params.cluster_sample_type
              },
              {
                  "name": "--cluster-type",
                  "value": fn_params.cluster_type
              },
              {
                  "name": "--cluster-metric",
                  "value": fn_params.cluster_metric
              },
              {
                  "name": "--workdir",
                  "value": pickle_dir
              },
              {
                  "name": "--hash",
                  "value": uid
              }
          ]
      });
    }
    else
    {
      json_payload.scripts.push({
            "name": "compute_timeseries",
            "parameters": [
                {
                    "name": "--directory",
                    "value": hdf5_dir
                },
                {
                    "name": "--cluster-sample-count",
                    "value": fn_params.cluster_sample_count
                },
                {
                    "name": "--cluster-sample-type",
                    "value": fn_params.cluster_sample_type
                },
                {
                    "name": "--cluster-type",
                    "value": fn_params.cluster_type
                },
                {
                    "name": "--cluster-metric",
                    "value": fn_params.cluster_metric
                },
                {
                    "name": "--workdir",
                    "value": pickle_dir
                },
                {
                    "name": "--hash",
                    "value": uid
                }
            ]
        });
    }

    client.post_remote_command({
      hostname: this.state.hostname,
      command: json_payload,
      success: function(results) {
        if (!results.errors) {
          console.log("Success");
          // alert('[Error] Could not start batch file for Slycat pre-built function ' + fn + ': ' + results.errors);
          // vm.on_error_callback();
          return void 0;
        }

        // if (vm.on_submit_callback)
        //   vm.on_submit_callback();
        const splitResult = results.errors.replace(/(\r\n\t|\n|\r\t)/gm,"").split(" ");
        const jid =  splitResult[splitResult.length-1];
        // vm.jid(jid);
        // vm.working_directory(fn_params.workdir + "/slycat/" + uid + "/");
        // server_update_model_info(uid);
      },
      error: function(request, status, reason_phrase) {
        console.log("Error");
        // alert('[Error] Could not start batch file: ' + reason_phrase);
        // vm.on_error_callback();
      }
    });
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
