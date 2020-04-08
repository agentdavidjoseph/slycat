/* Copyright (c) 2013, 2018 National Technology and Engineering Solutions of Sandia, LLC . Under the terms of Contract  DE-NA0003525 with National Technology and Engineering Solutions of Sandia, LLC, the U.S. Government  retains certain rights in this software. */

import jquery_ui_css from "jquery-ui/themes/base/all.css";

import ui_css from "../css/ui.css";

import api_root from "js/slycat-api-root";
import _ from "lodash";
import client from "js/slycat-web-client";
import bookmark_manager from "js/slycat-bookmark-manager";
import * as dialog from "js/slycat-dialog";
import React from "react";
import ReactDOM from "react-dom";
import DataUI from "./Components/DataUI.tsx";
// import d3 from "d3";
import URI from "urijs";
import * as chunker from "js/chunker";


// Wait for document ready
$(document).ready(function() {
console.log("in UI.js");
ReactDOM.render(<DataUI/> ,
  document.querySelector('#data-model'));
}
);
