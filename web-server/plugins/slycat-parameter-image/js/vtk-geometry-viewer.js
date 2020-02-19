import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import {
  ColorMode,
  ScalarMode,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

import { addCamera, } from './vtk-camera-synchronizer';

import { updateThreeDColorByOptions } from './actions';

var vtkstartinteraction_event = new Event('vtkstartinteraction');

export function load(container, buffer, uri) {

  // ----------------------------------------------------------------------------
  // Standard rendering code setup
  // ----------------------------------------------------------------------------

  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance({
    // Set the background to black
    background: [0, 0, 0] 
  });
  renderWindow.addRenderer(renderer);

  // ----------------------------------------------------------------------------
  // Simple pipeline VTP reader Source --> Mapper --> Actor
  // ----------------------------------------------------------------------------

  const vtpReader = vtkXMLPolyDataReader.newInstance();
  vtpReader.parseAsArrayBuffer(buffer);

  const lookupTable = vtkColorTransferFunction.newInstance();
  const source = vtpReader.getOutputData(0);
  const mapper = vtkMapper.newInstance({
    interpolateScalarsBeforeMapping: false,
    useLookupTableScalarRange: true,
    lookupTable,
    scalarVisibility: false,
  });
  mapper.setInputData(source);
  const actor = vtkActor.newInstance();
  const scalars = source.getPointData().getScalars();
  const dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);
  let activeArray = vtkDataArray;
  actor.setMapper(mapper);

  // --------------------------------------------------------------------
  // Color handling
  // --------------------------------------------------------------------
  
  let colormap;

  function applyPreset() {
    // console.log('setting color to: ' + window.store.getState().threeDColormap);
    colormap = vtkColorMaps.getPresetByName(window.store.getState().threeDColormap);
    lookupTable.applyColorMap(colormap);
    lookupTable.setMappingRange(dataRange[0], dataRange[1]);
    lookupTable.updateRange();

    // Not part of VTK example, but needs to be done to get update after chaning color options
    renderWindow.render();
  }

  function applyPresetIfChanged() {
    if(vtkColorMaps.getPresetByName(window.store.getState().threeDColormap) != colormap)
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
  
  let colorBy;

  const colorByOptions = [{ value: ':', label: 'Solid color' }].concat(
    source
      .getPointData()
      .getArrays()
      .map((a) => ({
        label: `(p) ${a.getName()}`,
        value: `PointData:${a.getName()}`,
      })),
    source
      .getCellData()
      .getArrays()
      .map((a) => ({
        label: `(c) ${a.getName()}`,
        value: `CellData:${a.getName()}`,
      }))
  );
  // Dispatch update to available color by options to redux store
  window.store.dispatch(updateThreeDColorByOptions(uri, colorByOptions));

  function updateColorBy() {
    colorBy = window.store.getState().three_d_colorvars[uri];

    const [location, colorByArrayName] = colorBy.split(':');
    const interpolateScalarsBeforeMapping = location === 'PointData';
    let colorMode = ColorMode.DEFAULT;
    let scalarMode = ScalarMode.DEFAULT;
    const scalarVisibility = location.length > 0;

    if (scalarVisibility) {
      const newArray = source[`get${location}`]().getArrayByName(
        colorByArrayName
      );
      activeArray = newArray;
      const newDataRange = activeArray.getRange();
      dataRange[0] = newDataRange[0];
      dataRange[1] = newDataRange[1];
      colorMode = ColorMode.MAP_SCALARS;
      scalarMode =
        location === 'PointData'
          ? ScalarMode.USE_POINT_FIELD_DATA
          : ScalarMode.USE_CELL_FIELD_DATA
      ;
      
      const numberOfComponents = activeArray.getNumberOfComponents();
      if (numberOfComponents > 1) {
        // always start on magnitude setting
        if (mapper.getLookupTable()) {
          const lut = mapper.getLookupTable();
          lut.setVectorModeToMagnitude();
        }
        // componentSelector.style.display = 'block';
        // const compOpts = ['Magnitude'];
        // while (compOpts.length <= numberOfComponents) {
        //   compOpts.push(`Component ${compOpts.length}`);
        // }
        // componentSelector.innerHTML = compOpts
        //   .map((t, index) => `<option value="${index - 1}">${t}</option>`)
        //   .join('');
      } else {
        // componentSelector.style.display = 'none';
      }
    }
    else {
      // componentSelector.style.display = 'none';
    }
    mapper.set({
      colorByArrayName,
      colorMode,
      interpolateScalarsBeforeMapping,
      scalarMode,
      scalarVisibility,
    });
    applyPreset();

    // debugger;
  }

  function updateColorByIfChanged() {
    if(window.store.getState().three_d_colorvars[uri] != colorBy)
    {
      console.log("ColorBy changed, so applying the new one.");
      updateColorBy();
    }
    else{
      console.log("ColorBy did not changed, so not applying the new one.");
    }
  }

  updateColorBy();

  // Set the 3D colormap to what's in the Redux state
  // each time the Redux state changes.
  window.store.subscribe(updateColorByIfChanged);

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

  // Get the active camera and pass it to camera synchronizer
  let camera = renderer.getActiveCamera();
  addCamera(camera, container, interactor);
}