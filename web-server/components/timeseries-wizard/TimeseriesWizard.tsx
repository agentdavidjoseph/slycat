import * as React from "react";
import ModalContent from "components/ModalContent.tsx";
import client from "js/slycat-web-client";
import SlycatFormRadioCheckbox from 'components/SlycatFormRadioCheckbox.tsx';

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
        <li className="nav-item"><a className="nav-link">Timeseries Parameters</a></li>
        <li className="nav-item"><a className="nav-link">Select Timeseries File</a></li>
        <li className="nav-item"><a className="nav-link">Select HDF5 Directory</a></li>
        <li className="nav-item"><a className="nav-link">HPC Parameters</a></li>
        <li className="nav-item"><a className="nav-link">Name Model</a></li>
      </ul>
        {this.state.visibleTab === "0" ?
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
        :null}
      </div>
    );
  }

  getFooterJSX(): JSX.Element {
    let footerJSX = [];
    if(this.state.visibleTab == '0') {
      footerJSX.push(<button key={4} type='button' className='btn btn-primary' onClick={this.continue}>
      Continue
      </button>)
    }
    return footerJSX;
  }

  continue = () =>
  {
    if (this.state.visibleTab === "0")
    {
      this.setState({visibleTab: "1"});
    }
  };

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
