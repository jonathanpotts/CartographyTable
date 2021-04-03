import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import ServerModel from './models/ServerModel';
import WorldModel from './models/WorldModel';
import ChunkModel from './models/ChunkModel';
import BlockModel from './models/BlockModel';
import VectorXZ from './models/VectorXZ';
import VectorXYZ from './models/VectorXYZ';
import Helpers from './Helpers';

/**
 * Handles loading data for the server.
 */
export default class ServerLoader {
  /**
   * Model containing the server data.
   */
  private serverModel!: ServerModel;

  /**
   * Creates a new instance of the server loader.
   * @param engine Engine used for rendering the map.
   */
  // eslint-disable-next-line no-useless-constructor
  public constructor(private readonly engine: Engine) {
  }

  /**
   * Loads the server data.
   */
  public async load(): Promise<void> {
    const response = await fetch('data/server.json');
    if (!response.ok) {
      throw new Error('Unable to retrieve server data.');
    }

    this.serverModel = await response.json();
    if (this.serverModel.worlds.length <= 0) {
      throw new Error('No worlds are defined on the server.');
    }

    const scene = await this.loadWorld(this.serverModel.worlds[0]);
    const camera = new UniversalCamera('camera', new Vector3(0, 10, 0), scene);

    this.engine.stopRenderLoop();
    this.engine.runRenderLoop(() => {
      scene.render();
    });
  }

  /**
   * Loads the world data.
   * @param world World to load data for.
   */
  private async loadWorld(world: WorldModel): Promise<Scene> {
    const scene = new Scene(this.engine);
    scene.clearColor = Color3.Black().toColor4();

    const spawnChunk = Helpers.getChunkCoordinates(world.spawn);

    return scene;
  }

  public static async loadChunk(coordinates: VectorXZ, world: WorldModel): Promise<void> {
    const response = await fetch(`data/worlds/${world.name}/${coordinates.x}.${coordinates.z}.json`);
    if (!response.ok) {
      throw new Error(`Unable to load chunk data for ${world.name}:${coordinates.x},${coordinates.z}.`);
    }

    const chunkModel: ChunkModel = await response.json();

    chunkModel.blocks.forEach((yMap, y) => {
      yMap.forEach((xMap, x) => {
        xMap.forEach((blockModel, z) => {
          this.loadBlock({ x, y, z }, blockModel);
        });
      });
    });
  }

  public static loadBlock(coordinates: VectorXYZ, block: BlockModel): void {
  }
}
