import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkSTLReader from 'vtk.js/Sources/IO/Geometry/STLReader';
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkLabelWidget from 'vtk.js/Sources/Interaction/Widgets/LabelWidget';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import slycat_threeD_color_maps from "js/slycat-threeD-color-maps";
import {
  ColorMode,
  ScalarMode,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

import { addCamera, } from './vtk-camera-synchronizer';

import { 
  updateThreeDColorByOptions,
  setThreeDColorByRange,
  adjustThreeDVariableDataRange,
} from './actions';
import _ from 'lodash';

var vtkstartinteraction_event = new Event('vtkstartinteraction');

export function getDataRange(colorBy) {
  if(colorBy == ":")
  {
    return [0,1];
  }
  const three_d_variable_data_ranges = window.store.getState().three_d_variable_data_ranges[colorBy];
  const three_d_variable_user_ranges = window.store.getState().three_d_variable_user_ranges[colorBy];
  // console.debug(`vtk-geometry-viewer three_d_variable_user_ranges for ${colorBy} is ${three_d_variable_user_ranges}`);
  // console.debug(`vtk-geometry-viewer three_d_variable_data_ranges for ${colorBy} is ${three_d_variable_data_ranges}`);
  const min = three_d_variable_user_ranges && three_d_variable_user_ranges.min !== undefined ? 
    three_d_variable_user_ranges.min : three_d_variable_data_ranges.min;
  const max = three_d_variable_user_ranges && three_d_variable_user_ranges.max !== undefined ? 
    three_d_variable_user_ranges.max : three_d_variable_data_ranges.max;
  return [min, max];
}

export function load(container, buffer, uri, uid, type) {

  // ----------------------------------------------------------------------------
  // Standard rendering code setup
  // ----------------------------------------------------------------------------

  const renderWindow = vtkRenderWindow.newInstance();

  const rgb = window.store.getState().threeD_background_color;
  const renderer = vtkRenderer.newInstance({
    // Set the background color
    background: [
      rgb[0]/255, 
      rgb[1]/255, 
      rgb[2]/255,
    ],
  });
  renderWindow.addRenderer(renderer);

  // ----------------------------------------------------------------------------
  // Simple pipeline VTP reader Source --> Mapper --> Actor
  // ----------------------------------------------------------------------------

  let mapper, lookupTable, source, scalars, dataRange, activeArray;
  if (type == 'stl')
  {
    const stlReader = vtkSTLReader.newInstance();
    mapper = vtkMapper.newInstance({ scalarVisibility: false });
    mapper.setInputConnection(stlReader.getOutputPort());
    stlReader.parseAsArrayBuffer(buffer);
  }
  else if (type == 'vtp')
  {
    const vtpReader = vtkXMLPolyDataReader.newInstance();
    vtpReader.parseAsArrayBuffer(buffer);

    lookupTable = vtkColorTransferFunction.newInstance();
    source = vtpReader.getOutputData(0);
    mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: false,
      useLookupTableScalarRange: true,
      lookupTable,
      scalarVisibility: false,
    });
    mapper.setInputData(source);
    scalars = source.getPointData().getScalars();
    dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);
    activeArray = vtkDataArray;
  
    // --------------------------------------------------------------------
    // Color handling
    // --------------------------------------------------------------------
    
    let colormap;

    function applyPreset() {
      // console.log('setting color to: ' + window.store.getState().threeDColormap);
      colormap = slycat_threeD_color_maps.vtk_color_maps[window.store.getState().threeDColormap];
      lookupTable.applyColorMap(colormap);
      lookupTable.setMappingRange(dataRange[0], dataRange[1]);
      lookupTable.updateRange();

      // Not part of VTK example, but needs to be done to get update after changing color options
      renderWindow.render();
    }

    function applyPresetIfChanged() {
      if(slycat_threeD_color_maps.vtk_color_maps[window.store.getState().threeDColormap] != colormap)
      {
        // console.log("Colormap changed, so applying the new one.");
        applyPreset();
      }
      else{
        // console.log("Colormap did not changed, so not applying the new one.");
      }
    }

      // Set the 3D colormap to what's currently in the Redux store
    applyPreset();

    // Set the 3D colormap to what's in the Redux state
    // each time the Redux state changes.
    window.store.subscribe(applyPresetIfChanged);
    
    // --------------------------------------------------------------------
    // ColorBy handling
    // --------------------------------------------------------------------
    
    // Default to Solid color
    let colorBy = ":";

    const colorByOptions = [{ 
        value: ':', 
        label: 'Solid color',
      }]
      .concat(
        source
          .getPointData()
          .getArrays()
          .map((a) => ({       
            label: a.getName(),
            value: `PointData:${a.getName()}`,
            type: 'Point',
            components: a.getNumberOfComponents(),
        })),
        source
          .getCellData()
          .getArrays()
          .map((a) => ({
            label: a.getName(),
            value: `CellData:${a.getName()}`,
            type: 'Cell',
            components: a.getNumberOfComponents(),
        })
      )
    );
    // Dispatch update to available color by options to redux store
    window.store.dispatch(updateThreeDColorByOptions(uri, colorByOptions));

    // Loop through all color by variables and get their data ranges
    colorByOptions.forEach((element, index) => {
      const [pointOrCell, varName] = element.value.split(':');
      // Don't do anything when not coloring by a variable
      if (pointOrCell.length > 0)
      {
        const array = source[`get${pointOrCell}`]().getArrayByName(
          varName
        );
        const dataRange = array.getRange();
        // Dispatch update to color variable ranges to redux store.
        // console.log(`Data range for ${uri} colored by ${colorBy} is: ${dataRange[0]} - ${dataRange[1]}`);
        window.store.dispatch(adjustThreeDVariableDataRange(element.value, dataRange));
        window.store.dispatch(setThreeDColorByRange(uri, element.value, dataRange));
        // If there are any components, look up their ranges and dispatch updates to redux store.
        if (element.components > 1)
        {
          [...Array(element.components)].forEach((component, componentIndex) => {
            const componentRange = array.getRange(componentIndex);
            // console.log(`Data range for ${uri} colored by ${colorBy} is: ${dataRange[0]} - ${dataRange[1]}`);
            window.store.dispatch(adjustThreeDVariableDataRange(`${element.value}:${componentIndex}`, componentRange));
            window.store.dispatch(setThreeDColorByRange(uri, `${element.value}:${componentIndex}`, componentRange));
          });
        }
      }
    });

    function updateColorBy() {
      // Use default colorBy if we don't have a setting for it in the state
      if(window.store.getState().three_d_colorvars && window.store.getState().three_d_colorvars[uid])
      {
        colorBy = window.store.getState().three_d_colorvars[uid];
      }

      const [location, colorByArrayName, componentString] = colorBy.split(':');
      // Convert component string to integer, set to undefined if there isn't one
      const component = componentString ? parseInt(componentString, 10) : undefined;
      const interpolateScalarsBeforeMapping = location === 'PointData';
      let colorMode = ColorMode.DEFAULT;
      let scalarMode = ScalarMode.DEFAULT;
      const scalarVisibility = location.length > 0;

      // We are coloring by point or cell data
      if (scalarVisibility) 
      {
        const newArray = source[`get${location}`]().getArrayByName(
          colorByArrayName
        );
        activeArray = newArray;

        const vtpDataRange = component > -1 ? activeArray.getRange(component) : activeArray.getRange();
        console.group(`Data ranges of %s variable %s%s for %s`,
          location,
          colorByArrayName,
          componentString ? `[${Number(componentString)+1}]` : '',
          uri,
        );
        console.debug(`From this VTP file:                      %o`,
          vtpDataRange,
        );
        const newDataRange = getDataRange(colorBy);
        console.debug(`From Display Settings > Variable Ranges: %o`, 
          newDataRange,
        );
        console.groupEnd();
        dataRange[0] = newDataRange[0];
        dataRange[1] = newDataRange[1];
        colorMode = ColorMode.MAP_SCALARS;
        scalarMode =
          location === 'PointData'
            ? ScalarMode.USE_POINT_FIELD_DATA
            : ScalarMode.USE_CELL_FIELD_DATA
        ;
        
        if(mapper.getLookupTable())
        {
          const lut = mapper.getLookupTable();
          // If a component has been selected, use it.
          if(component > -1) 
          {
            lut.setVectorModeToComponent();
            lut.setVectorComponent(component);
            lookupTable.setMappingRange(dataRange[0], dataRange[1]);
            lut.updateRange();
          }
          // Use magnitude if a component has not been selected.
          // This seems to happen with point data when a component is not selected
          // and with cell data (which don't seem to have components).
          else
          {
            lut.setVectorModeToMagnitude();
          }
        }
      }

      mapper.set({
        colorByArrayName,
        colorMode,
        interpolateScalarsBeforeMapping,
        scalarMode,
        scalarVisibility,
      });
      applyPreset();
    }

    function updateColorByIfChanged() {
      const colorVariableChanged = window.store.getState().three_d_colorvars
        && window.store.getState().three_d_colorvars[uid]
        && window.store.getState().three_d_colorvars[uid] != colorBy
        ;
      
      const colorVariableRangeChanged = !_.isEqual(getDataRange(colorBy), dataRange);
      // console.log(`colorVariableRangeChanged: ${colorVariableRangeChanged}`);

      if(colorVariableChanged || colorVariableRangeChanged)
      {
        // console.log("ColorBy changed, so applying the new one.");
        updateColorBy();
      }
      else{
        // console.log("ColorBy did not changed, so not applying the new one.");
      }
    }

    updateColorBy();

    // Set the 3D colormap to what's in the Redux state
    // each time the Redux state changes.
    window.store.subscribe(updateColorByIfChanged);

  }

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);

  // ----------------------------------------------------------------------------
  // Add the actor to the renderer and set the camera based on it
  // ----------------------------------------------------------------------------

  renderer.addActor(actor);
  renderer.resetCamera();

  // ----------------------------------------------------------------------------
  // Use OpenGL as the backend to view the all this
  // ----------------------------------------------------------------------------

  const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
  renderWindow.addView(openglRenderWindow);

  // ----------------------------------------------------------------------------
  // Set the container for the OpenGL renderer
  // ----------------------------------------------------------------------------
  openglRenderWindow.setContainer(container);

  // ----------------------------------------------------------------------------
  // Capture size of the container and set it to the renderWindow
  // ----------------------------------------------------------------------------

  function setSize() {
    const { width, height } = container.getBoundingClientRect();
    openglRenderWindow.setSize(width, height);
  }

  setSize();

  // Listen for the resize event and reset the size
  container.addEventListener('vtkresize', (e) => { 
    // console.log('vtk resized');
    setSize();
    interactor.render();
  }, false);

  // ----------------------------------------------------------------------------
  // Setup an interactor to handle mouse events
  // ----------------------------------------------------------------------------

  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setView(openglRenderWindow);
  interactor.initialize();
  interactor.bindEvents(container);

  // ----------------------------------------------------------------------------
  // Display time step if the data exists
  // ----------------------------------------------------------------------------
  const TimeValue = source.getFieldData().getArrayByName('TimeValue');
  if(TimeValue)
  {
    const timeStep = TimeValue.getData()[0];
    // console.log(`Time: ${timeStep}`);
    const timeLabel = document.createElement('div');
    timeLabel.classList.add('timeLabel');
    const text = document.createTextNode(`Time: ${timeStep}`);
    timeLabel.appendChild(text);
    container.appendChild(timeLabel);
  }

  // ----------------------------------------------------------------------------
  // Setup interactor style to use
  // ----------------------------------------------------------------------------

  const interactorStyle = vtkInteractorStyleTrackballCamera.newInstance();
  interactor.setInteractorStyle(interactorStyle);

  // Dispatching a vtk start interaction event when someone starts interacting with this 
  // 3d model. It's used by the scatterplot to select the model's frame.
  interactorStyle.onStartInteractionEvent(() => {
    // console.log('interactorStyle.onStartInteractionEvent');
    container.dispatchEvent(vtkstartinteraction_event);
  });

  // Get the active camera
  let camera = renderer.getActiveCamera();

  // Set the camera based on what's in the state
  let cameraState = window.store.getState().three_d_cameras ? window.store.getState().three_d_cameras[uid] : false;
  if(cameraState)
  {
    // console.log('we have state for the camera: ' + cameraState);
    camera.setPosition(...cameraState.position);
    camera.setFocalPoint(...cameraState.focalPoint);
    camera.setViewUp(...cameraState.viewUp);
    camera.setClippingRange(...cameraState.clippingRange);
    // renderer.resetCamera();
    interactor.render();
  }

  // Pass the active camera to camera synchronizer
  addCamera(camera, container, interactor, uid);
}