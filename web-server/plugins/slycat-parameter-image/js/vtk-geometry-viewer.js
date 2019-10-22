import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

export function load(container, buffer) {
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
  const source = vtpReader.getOutputData(0);
  const mapper = vtkMapper.newInstance();
  mapper.setInputData(source);
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

  // Listen for the event.
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

  interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
  
}