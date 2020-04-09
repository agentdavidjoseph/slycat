'use strict';
import * as React from 'react';

export interface WizardModalProps {
  closeModal(): ()=>void
  header: JSX.Element
  body: JSX.Element
  footer: JSX.Element
  title: string
}
/**
 * functional component used to create wizard modals
 */
export const WizardModal : React.FC<WizardModalProps> = (props) => {
    return (
      <div>
        <div className="modal-header">
          <h3 className="modal-title">{props.title}</h3>
          {props.header}
          <button type="button" className="close" onClick={()=>props.closeModal()} 
          data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          {props.body}
        </div>
        <div className="modal-footer">
          {props.footer}
        </div>
      </div>
    );
}
