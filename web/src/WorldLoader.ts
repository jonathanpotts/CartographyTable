import { Engine } from '@babylonjs/core/Engines/engine';

export default class WorldLoader {
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }
}
