
import client from "js/slycat-web-client";
import * as dialog from "js/slycat-dialog";
//returns and object with id
export interface CreateModelResponse {
  id: string//this is the model id that is created
}; 
export const createModel = (
  projectId: string,
  dataModel: string,
  name: string,
  description: string,
  marking: string): Promise<CreateModelResponse> => {
  return client.post_project_models_fetch( 
    projectId, dataModel, name, description, marking).then((response: Response) => {
      if(!response.ok) {
        dialog.ajax_error('Error creating model.');
      };
      return response.json();
    }).catch((error: any) => {
      dialog.ajax_error('Error creating model.'),
      console.log(error);
    });
};