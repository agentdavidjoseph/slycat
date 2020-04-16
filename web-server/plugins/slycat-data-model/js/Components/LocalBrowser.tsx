'use strict';
import * as React from 'react';

export interface LocalBrowserProps {
  readFile(event: any): ()=>void
}
/**
 * functional component used to create wizard modals
 */
export const LocalBrowser : React.FC<LocalBrowserProps> = (props) => {
  // component.selection = params.selection;
  // component.disabled = params.disabled === undefined ? false : params.disabled;
  // component.multiple = params.multiple == true ? 'multiple' : null; // Set multiple parameter to true if you want multiple file selection enabled
  // component.progress = params.progress != undefined ? params.progress : ko.observable(undefined);
  // component.progress_status = params.progress_status != undefined ? params.progress_status : ko.observable('');
  // component.selection_changed = function(model, event)
  // {
  //   component.selection(event.target.files);
  // }
  return (
    <React.Fragment>
      <div className="form-group row">
        {/* <label for="slycat-local-browser-file" class="col-sm-2 col-form-label"
          data-bind="css: {'disabled' : disabled}">
          File
        </label> */}
        <div className="col-sm-10">
          <input 
            type="file" className="" id="slycat-local-browser-file" placeholder="file" 
            onChange={(event: any)=> { props.readFile(event) }}
            onClick={(event: any)=> { event.target.value = null }}
          />
        </div>
      </div>
    </React.Fragment>
  );
}
