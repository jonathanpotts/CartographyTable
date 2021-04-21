import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import BlockStateLoader from './BlockStateLoader';
// import ServerLoader from './ServerLoader';
import '@babylonjs/core/Loading/loadingScreen';
import './index.scss';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
// const serverLoader = new ServerLoader(canvas);
// serverLoader.load();

const engine = new Engine(
  canvas, true, { audioEngine: false, autoEnableWebVR: false, xrCompatible: false },
);

window.addEventListener('resize', () => {
  engine.resize();
});

engine.loadingScreen.displayLoadingUI();
const scene = new Scene(engine);
const camera = new UniversalCamera('camera', new Vector3(0, 0, -4), scene);
camera.attachControl(true);

engine.runRenderLoop(() => {
  scene.render();
});

const loader = new BlockStateLoader(scene);
loader.loadAsync('minecraft:grass_block', 'snowy=false').then(() => {
  engine.loadingScreen.hideLoadingUI();
});

// #region Development builds only
/// #if env.dev
const debug = async () => {
  await import('@babylonjs/inspector');

  document.addEventListener('keydown', (ev) => {
    if ((ev as KeyboardEvent).code === 'Backquote') {
      if (scene.debugLayer.isVisible()) {
        scene.debugLayer.hide();
      } else {
        scene.debugLayer.show();
      }
    }
  });
};

debug();
/// #endif
// #endregion
