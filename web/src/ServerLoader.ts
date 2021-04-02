import { Engine } from '@babylonjs/core/Engines/engine';

/**
 * Handles loading data for the server.
 */
export default class ServerLoader {
  /**
   * Engine used for rendering the map.
   */
  private engine: Engine;

  /**
   * Creates a new instance of the server loader.
   * 
   * @param engine Engine used for rendering the map.
   */
  constructor(engine: Engine) {
    this.engine = engine;
  }
}
