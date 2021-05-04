import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { ILoadingScreen } from '@babylonjs/core/Loading/loadingScreen';
import BlockStateLoader from './BlockStateLoader';
import BlockDataModel from './models/BlockDataModel';
import ServerModel from './models/ServerModel';
import Helpers from './Helpers';
import './index.scss';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

fetch('data/server.json').then(async (response) => {
  if (!response.ok) {
    throw new Error('Unable to retrieve server data');
  }
  const serverData: ServerModel = await response.json();
  document.title = `${serverData.motd} - ${document.title}`;
  canvas.setAttribute('aria-label', `3D map of ${serverData.motd}`);
});

const loadingScreenDiv = document.getElementById('loading') as HTMLDivElement;
const loadingScreen: ILoadingScreen = {
  displayLoadingUI: () => {
    loadingScreenDiv.classList.remove('hidden');
    loadingScreenDiv.classList.add('visible');
  },
  hideLoadingUI: () => {
    loadingScreenDiv.classList.remove('visible');
    loadingScreenDiv.classList.add('hidden');
  },
  loadingUIBackgroundColor: 'black',
  loadingUIText: '',
};

// const serverLoader = new ServerLoader(canvas);
// serverLoader.load();

const engine = new Engine(
  canvas, true, { audioEngine: false, autoEnableWebVR: false, xrCompatible: false },
);
engine.loadingScreen = loadingScreen;

window.addEventListener('resize', () => {
  engine.resize();
});

engine.loadingScreen.displayLoadingUI();
const scene = new Scene(engine);
// scene.clearColor = new Color4(0, 0, 0, 1);
const camera = new UniversalCamera('camera', new Vector3(0, 0, -4), scene);
camera.attachControl(true);

engine.runRenderLoop(() => {
  scene.render();
});

Helpers.loadAsync().then(() => {
  const testBlock: BlockDataModel = {
    material: 8,
    data: 'snowy=false',
    biome: 4,
    temperature: 0.7,
    humidity: 0.8,
  };

  // const testBlock: BlockDataModel = { material: 171 };

  const loader = new BlockStateLoader(scene);
  loader.loadAsync(testBlock).then(() => {
    engine.loadingScreen.hideLoadingUI();
  });
});

// #region Development builds only
/// #if env.dev
(async () => {
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
})();
/// #endif
// #endregion
