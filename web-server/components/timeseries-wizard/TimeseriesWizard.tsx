import * as React from "react";
import ModalContent from "components/ModalContent.tsx";
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
export default class TimeseriesWizard extends React.Component<
  TimeseriesWizardProps,
  TimeseriesWizardState
> {
  public constructor(props: TimeseriesWizardProps) {
    super(props);
    this.state = {
      TimeSeriesLocalStorage: localStorage.getItem("slycat-timeseries-wizard") as any,
    };
  }

  getBodyJsx(): JSX.Element {
    return <div>body</div>;
  }

  getFooterJSX(): JSX.Element {
    return <div>footer</div>;
  }

  render() {
    return (
        <ModalContent
          closingCallBack={() => {
            console.log("called closing callback");
          }}
          title={"Timeseries Wizard"}
          body={this.getBodyJsx()}
          footer={this.getFooterJSX()}
        />
    );
  }
}
