/* Copyright (c) 2013, 2018 National Technology and Engineering Solutions of Sandia, LLC . Under the terms of Contract
 DE-NA0003525 with National Technology and Engineering Solutions of Sandia, LLC, the U.S. Government
 retains certain rights in this software. */

import server_root from "js/slycat-server-root";
import * as dialog from "js/slycat-dialog";
import ko from "knockout";
import mapping from "knockout-mapping";
import fileUploader from "js/slycat-file-uploader-factory";
import "js/slycat-local-browser";
import "js/slycat-parser-controls";
import { remoteControlsReauth } from "js/slycat-remote-controls";
import "js/slycat-remote-browser";
import "js/slycat-table-ingestion";
import dataModelWizardUI from "../wizard-ui.html";
import React from "react";
import ReactDOM from "react-dom";
import DataWizard from "./Components/DataWizard.tsx";

function constructor(params)
{
  const PID = params.projects()[0]._id();
  console.log(`wizardjs test calling render ${JSON.stringify(PID)}`);

  ReactDOM.render(<DataWizard
    projectId={PID}
  /> ,
    document.querySelector('#data-model')
);
}

export default {
  viewModel: constructor,
  template: dataModelWizardUI,
};