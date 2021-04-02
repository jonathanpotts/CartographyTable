import { Engine } from '@babylonjs/core/Engines/engine';

import WorldLoader from './WorldLoader';

import '@babylonjs/core/Materials/standardMaterial';
import './index.scss';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

const worldLoader = new WorldLoader(engine);
const scene = worldLoader.loadWorld('world');

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener('resize', () => {
  engine.resize();
});
