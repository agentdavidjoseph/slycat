import client from "js/slycat-web-client";
import * as dialog from "js/slycat-dialog";

export default function doPoll(mid){
  // Return a new promise.
  return new Promise(function try_get_model(resolve, reject) {
    client
      .get_model_fetch(
        {
          mid: mid,
        },
        // Not passing success and error functions because we handle both below with 
        // .then and .catch
        // (response) => {
        //   console.log('This is the success function. Response: ' + response);
        // },
        // (error) => {
        //   console.log('This is the error function. ' + error);
        // },
      )
      .then(
        (model) => {
          // console.log('got model fetch');
          // When state is waiting or running, wait 5 seconds and try again
          if(model["state"] === "waiting" || model["state"] === "running") {
            // console.log("Model is waiting or running, so will try to retrieve it again soon...");
            setTimeout(function(){try_get_model(resolve, reject)}, 5000);
          }
          // Reject closed with no results and failed models
          else if(model["state"] === "closed" && model["result"] === null) {
            // console.log("Model is closed with no results, so rejecting promise...");
            reject("Closed with no result.");
          }
          else if(model["result"] === "failed") {
            // console.log("Model has failed, so rejecting promise...");
            reject("Failed.");
          }
          // Otherwise resolve the promise
          else {
            resolve(model);
          }
        }
      )
      .catch(
        (error) => {
          // console.log('This is the catch error. ' + error);
          dialog.dialog({
            title: "Error Retrieving Model",
            message: "Oops, there was a problem retrieving the model. Below are the error details. <br /><br />" + error,
          });
        }
      )
    ;
  });
}