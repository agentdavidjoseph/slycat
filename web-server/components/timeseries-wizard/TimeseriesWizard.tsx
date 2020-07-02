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
 * takes a list of messages to be displayed as a warning
 */
export default class TimeseriesWizard extends React.Component<
  TimeseriesWizardProps,
  TimeseriesWizardState
> {
  public constructor(props: TimeseriesWizardProps) {
    super(props);
    this.state = {
      username: localStorage.getItem("slycat-timeseries-wizard") as any,
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
          title={"Timeseries"}
          body={this.getBodyJsx()}
          footer={this.getFooterJSX()}
        />
    );
  }
}
