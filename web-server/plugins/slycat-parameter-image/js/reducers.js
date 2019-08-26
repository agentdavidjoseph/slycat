import {
  CHANGE_FONT_SIZE,
  CHANGE_FONT_FAMILY,
  CHANGE_AXES_VARIABLE_SCALE,
  CHANGE_VARIABLE_ALIAS_LABEL,
} from './actions';

const initialState = {
  fontSize: 15,
  fontFamily: "Arial",
  axesVariables: {},
  variableAliases: {},
}

export default function slycat(state = initialState, action) {
  switch (action.type) {
    case CHANGE_FONT_SIZE:
      return Object.assign({}, state, {
        fontSize: action.fontSize
      })
    case CHANGE_FONT_FAMILY:
      return Object.assign({}, state, {
        fontFamily: action.fontFamily
      })
    case CHANGE_AXES_VARIABLE_SCALE:
      return Object.assign({}, state, {
        axesVariables: Object.assign({}, state.axesVariables, {[action.axesVariable]: action.axesScale})
      })
    case CHANGE_VARIABLE_ALIAS_LABEL:
      return Object.assign({}, state, {
        variableAliases: Object.assign({}, state.variableAliases, {[action.aliasVariable]: action.aliasLabel})
      })
    default:
      return state
  }
}
