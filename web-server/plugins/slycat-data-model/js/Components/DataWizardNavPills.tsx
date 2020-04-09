'use strict';
import * as React from 'react';

export interface DataWizardNavPillsProps {
  activeTab: number
}
/**
 * functional component used to create wizard modals
 */
export const DataWizardNavPills : React.FC<DataWizardNavPillsProps> = (props) => {
  return (
    <React.Fragment>
        <ul className="nav nav-pills">
          <li className={props.activeTab===0?"nav-item active":"nav-item"}>
            <a className="nav-link">Locate Data</a>
          </li>
          <li className={props.activeTab===1?"nav-item active":"nav-item"}>
            <a className="nav-link">Upload Data</a>
          </li>
        </ul>
    </React.Fragment>
  );
}
