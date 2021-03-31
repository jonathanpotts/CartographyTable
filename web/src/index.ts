import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { BackgroundMaterial } from '@babylonjs/core/Materials/Background/backgroundMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

import WorldLoader from './WorldLoader';

import '@babylonjs/core/Materials/standardMaterial';
import './index.scss';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

const worldLoader = new WorldLoader(engine);

function createScene(): Scene {
  const scene = new Scene(engine);

  const box = MeshBuilder.CreateBox('box', {}, scene);

  const dirtMat = new BackgroundMaterial('dirtMat', scene);
  dirtMat.diffuseTexture = new Texture('data/textures/block/dirt.png', scene, true, false, Texture.NEAREST_NEAREST);
  box.material = dirtMat;

  const camera = new UniversalCamera('camera', new Vector3(0, 0, -10), scene);
  camera.attachControl(canvas, true);

  return scene;
}

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener('resize', () => {
  engine.resize();
});
