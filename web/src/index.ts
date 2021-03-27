import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { BackgroundMaterial } from '@babylonjs/core/Materials/Background/backgroundMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

import '@babylonjs/core/Materials/standardMaterial';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

function createScene(): Scene {
  const scene = new Scene(engine);

  const box = MeshBuilder.CreateBox('box', {}, scene);

  const dirtMat = new BackgroundMaterial('dirtMat', scene);
  dirtMat.diffuseTexture = new Texture('data/textures/block/dirt.png', scene, true, false, Texture.NEAREST_NEAREST);
  box.material = dirtMat;

  const camera = new UniversalCamera('camera', new Vector3(0, 0, -10), scene);
  camera.keysUp.push(87);
  camera.keysDown.push(83);
  camera.keysLeft.push(65);
  camera.keysRight.push(68);
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
