import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import BlockLoader from './BlockLoader';
import './index.scss';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Loading/loadingScreen';
// import ServerLoader from './ServerLoader';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
// const serverLoader = new ServerLoader(canvas);
// serverLoader.load();

const engine = new Engine(
  canvas, true, { audioEngine: false, autoEnableWebVR: false, xrCompatible: false },
);

engine.loadingScreen.displayLoadingUI();
const scene = new Scene(engine);
BlockLoader.setScene(scene);
BlockLoader.load('minecraft:torch');
const camera = new UniversalCamera('camera', new Vector3(0, 0, -4), scene);
engine.loadingScreen.hideLoadingUI();
