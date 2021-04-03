import './index.scss';
import { Engine } from '@babylonjs/core/Engines/engine';
import ServerLoader from './ServerLoader';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

const serverLoader = new ServerLoader(engine);
serverLoader.load();

window.addEventListener('resize', () => {
  engine.resize();
});
