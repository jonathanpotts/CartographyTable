import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import './index.scss';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/inspector';
import BlockStateLoader from './BlockStateLoader';
// import ServerLoader from './ServerLoader';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
// const serverLoader = new ServerLoader(canvas);
// serverLoader.load();

const engine = new Engine(
  canvas, true, { audioEngine: false, autoEnableWebVR: false, xrCompatible: false },
);

engine.loadingScreen.displayLoadingUI();
const scene = new Scene(engine);
scene.debugLayer.show();
const camera = new UniversalCamera('camera', new Vector3(0, 0, -4), scene);
camera.attachControl(true);
const loader = new BlockStateLoader(scene);
loader.loadAsync('minecraft:torch').then(() => {
  engine.loadingScreen.hideLoadingUI();
});

engine.runRenderLoop(() => {
  scene.render();
});
