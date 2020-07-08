import * as React from "react";
import ModalContent from "components/ModalContent.tsx";
import client from "js/slycat-web-client";

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
      TimeSeriesLocalStorage: localStorage.getItem("slycat-timeseries-wizard") as any,
    };
    initialState = _.cloneDeep(this.state);
    this.create_model();
  }

  getBodyJsx(): JSX.Element {
    return <div>body</div>;
  }

  getFooterJSX(): JSX.Element {
    return <div>footer</div>;
  }

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
