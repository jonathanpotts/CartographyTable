import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { BoxBuilder } from '@babylonjs/core/Meshes/Builders/boxBuilder';
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
import Constants from './Constants';
import '@babylonjs/core/Materials/standardMaterial';

/**
 * Handles loading data for the server.
 */
export default class ServerLoader {
  /**
   * Model containing the server data.
   */
  private serverModel!: ServerModel;

  /**
   * Engine used for rendering the map.
   */
  private engine: Engine;

  /**
   * Status of the server being loaded.
   */
  private loaded = false;

  /**
   * Creates a new instance of the server loader.
   * @param canvas Canvas used to render the map.
   */
  public constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);

    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  /**
   * Loads the server data.
   */
  public async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    const response = await fetch('data/server.json');
    if (!response.ok) {
      this.loaded = false;
      throw new Error('Unable to retrieve server data.');
    }

    this.serverModel = await response.json();
    if (this.serverModel.worlds.length <= 0) {
      this.loaded = false;
      throw new Error('No worlds are defined on the server.');
    }

    this.changeWorld(this.serverModel.worlds[0]);
  }

  /**
   * Changes to a different world.
   * @param world World to change to.
   */
  private async changeWorld(world: WorldModel): Promise<void> {
    const scene = await this.loadWorld(world);

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
    await ServerLoader.loadChunk(spawnChunk, world, scene);

    const camera = new UniversalCamera('camera', new Vector3(world.spawn.x, world.spawn.y + 10, world.spawn.z), scene);

    return scene;
  }

  /**
   * Loads a chunk and adds it to the scene.
   * @param coordinates Coordinates of the chunk to load.
   * @param world World containing the chunk.
   * @param scene Scene to add the chunk to.
   */
  private static async loadChunk(coordinates: VectorXZ, world: WorldModel, scene: Scene)
  : Promise<void> {
    const response = await fetch(`data/worlds/${world.name}/${coordinates.x}.${coordinates.z}.json`);
    if (!response.ok) {
      throw new Error(`Unable to load chunk data for ${world.name}:${coordinates.x},${coordinates.z}.`);
    }

    const chunkModel: ChunkModel = await response.json();
    const transform = new TransformNode(`chunk:${coordinates.x},${coordinates.z}`, scene);
    transform.setPositionWithLocalVector(
      new Vector3(
        coordinates.x * Constants.WIDTH_OF_CHUNK, 0, coordinates.z * Constants.DEPTH_OF_CHUNK,
      ),
    );

    for (const [y, yMap] of Object.entries(chunkModel.blocks)) {
      for (const [x, xMap] of Object.entries(yMap)) {
        for (const [z, blockModel] of Object.entries(xMap)) {
          ServerLoader.loadBlock(
            { x: parseInt(x, 10), y: parseInt(y, 10), z: parseInt(z, 10) },
            blockModel, transform, scene,
          );
        }
      }
    }
  }

  private static loadBlock(
    coordinates: VectorXYZ, block: BlockModel, parent: TransformNode, scene: Scene,
  ): void {
    const box = BoxBuilder.CreateBox(`block:${coordinates.x},${coordinates.y},${coordinates.z}`, {}, scene);
    box.parent = parent;
    box.setPositionWithLocalVector(new Vector3(coordinates.x, coordinates.y, coordinates.z));
  }
}
