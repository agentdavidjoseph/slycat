'use strict';
import React, { useState } from 'react';
import ProgressBar from 'components/ProgressBar';
import ControlsButton from './controls-button';
import '../../css/controls-button-var-options.css';
import { FileSelector } from './file-selector';
import client from "js/slycat-web-client";
import fileUploader from "js/slycat-file-uploader-factory";

export default function ControlsButtonUpdateTable(props) {
  const modalId = 'varUpdateTableModal';
  const title = 'Update Table';
  const [files, setfiles] = useState([new File([""], "filename")]);
  const [disabled, setDisabled] = useState(true);
  const [progressBarHidden, setProgressBarHidden] = useState(true);
  const [progressBarProgress, setProgressBarProgress] = useState(0);
  const mid = props.mid;
  const pid = props.pid;

  const cleanup = () =>
  {
    setfiles([new File([""], "filename")]);
    setDisabled(true);
    setProgressBarHidden(true);
    setProgressBarProgress(0);
  };

  const closeModal = (e) =>
  {
    cleanup();
    $('#' + modalId).modal('hide');
  };

  const handleFileSelection = (selectorFiles) =>
  {
    setfiles(selectorFiles);
    setDisabled(false);
  };

  const uploadFile = () => 
  {
    console.log(files[0].name);
    setProgressBarHidden(false);
    setDisabled(true);
    client.get_model_command({
        mid: mid,
        type: "parameter-image",
        command: "delete-table",
        success: function (result_delete) {
            setProgressBarProgress(33);
            console.log(result_delete);
            var file = files[0];

            var fileObject ={
             pid: pid,
             mid: mid,
             file: file,
             aids: [["data-table"], file.name],
             parser: "slycat-csv-parser",
             success: function(){
               setProgressBarProgress(75);
               client.post_sensitive_model_command({
                mid: mid,
                type: "parameter-image",
                command: "update-table",
                parameters: {
                  linked_models: result_delete["linked_models"],
                },
                success: function (result_update) {
                  setProgressBarProgress(100);
                  console.log(result_update);
                  closeModal();
                  location.reload();
                },
                error: console.log("There was a problem uploading the new data")
              });
             },
             error: function(){
                //dialog.ajax_error("Did you choose the correct file and filetype?  There was a problem parsing the file: ")();
                //$('.local-browser-continue').toggleClass("disabled", false);
              }
            };
            fileUploader.uploadFile(fileObject);

          console.log("Success!");
        },
        error: function(){
        console.log("Failure.");
      }
    });
  };
  return (
    <React.Fragment>
      <div className='modal fade' data-backdrop='false' id={modalId}>
        <div className='modal-dialog'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h3 className='modal-title'>{title}</h3>
              <button type='button' className='close' data-dismiss='modal' aria-label='Close'>
              </button>
            </div>
            <div className='modal-body'>
              <FileSelector handleChange = {handleFileSelection} />
            </div>
            <div className='slycat-progress-bar'>
              <ProgressBar
                hidden={progressBarHidden}
                progress={progressBarProgress}
              />
            </div>
            <div className='modal-footer'>
              <button type='button' disabled={disabled} className='btn btn-danger' onClick={uploadFile}>
               Update Data Table
              </button>
              <button type='button' className='btn btn-primary' onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <ControlsButton label='Update Table' title={title} data_toggle='modal' data_target={'#' + modalId}
                      button_style={props.button_style} id='controls-button-death' />
    </React.Fragment>
  );
}