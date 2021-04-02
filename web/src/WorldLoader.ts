import { Engine } from '@babylonjs/core/Engines/engine';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Scene } from '@babylonjs/core/scene';

export default class WorldLoader {
  private engine: Engine;

  public constructor(engine: Engine) {
    this.engine = engine;
  }

  public loadWorld(name: string): Scene {
    const scene = new Scene(this.engine);
    scene.clearColor = Color3.Black().toColor4();
    return scene;
  }
}
