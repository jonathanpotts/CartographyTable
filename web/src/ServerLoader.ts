import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { ungzip } from 'pako';
import ServerModel from './models/ServerModel';
import WorldModel from './models/WorldModel';
import BlockDataModel from './models/BlockDataModel';
import VectorXZ from './models/VectorXZ';
import Helpers from './Helpers';
import Constants from './Constants';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Meshes/Builders/boxBuilder';
import '@babylonjs/core/Meshes/instancedMesh';
import BlockLoader from './BlockLoader';

/**
 * Handles loading data for the server.
 */
export default class ServerLoader {
  /**
   * Model containing the server data.
   */
  private serverModel!: ServerModel;

  /**
   * Canvas used to render the map.
   */
  private canvas: HTMLCanvasElement;

  /**
   * Engine used for rendering the map.
   */
  private engine: Engine;

  /**
   * Status of the server being loaded.
   */
  private loaded = false;

  /**
   * Blocks to create instances from.
   */
  private blocks: Record<string, Mesh> = {};

  /**
   * Creates a new instance of the server loader.
   * @param canvas Canvas used to render the map.
   */
  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true,
      { audioEngine: false, autoEnableWebVR: false, xrCompatible: false });

    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    this.engine.displayLoadingUI();
  }

  /**
   * Loads the server data.
   */
  public async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    await Helpers.load();

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
    this.engine.displayLoadingUI();

    this.engine.stopRenderLoop();

    const scene = await this.loadWorld(world);

    this.engine.runRenderLoop(() => {
      scene.render();
    });

    this.engine.hideLoadingUI();
  }

  /**
   * Loads the world data.
   * @param world World to load data for.
   */
  private async loadWorld(world: WorldModel): Promise<Scene> {
    const scene = new Scene(this.engine);
    scene.clearColor = Color3.Black().toColor4();
    BlockLoader.setScene(scene);

    const spawnChunk = Helpers.getChunkCoordinates(world.spawn);
    await ServerLoader.loadChunk(spawnChunk, world, scene);

    const camera = new UniversalCamera('camera', new Vector3(world.spawn.x, world.spawn.y + 10, world.spawn.z), scene);
    camera.setTarget(new Vector3(world.spawn.x, world.spawn.y, world.spawn.z));
    camera.keysUp.push('W'.charCodeAt(0));
    camera.keysLeft.push('A'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));
    camera.attachControl(this.canvas, true);

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
    const response = await fetch(`data/worlds/${world.name}/${coordinates.x}.${coordinates.z}.json.gz`);
    if (!response.ok) {
      throw new Error(`Unable to load chunk data for ${world.name}:${coordinates.x},${coordinates.z}.`);
    }

    const responseBody = new Uint8Array(await response.arrayBuffer());
    const responseJson = ungzip(responseBody, { to: 'string' });
    const chunkBlocks:
      Record<number, Record<number, Record<number, BlockDataModel>>> = JSON.parse(responseJson);

    const transform = new TransformNode(`chunk:${coordinates.x},${coordinates.z}`, scene);
    transform.setPositionWithLocalVector(
      new Vector3(
        coordinates.x * Constants.WIDTH_OF_CHUNK, 0, coordinates.z * Constants.DEPTH_OF_CHUNK,
      ),
    );

    for (const [y, yMap] of Object.entries(chunkBlocks)) {
      for (const [x, xMap] of Object.entries(yMap)) {
        for (const [z, blockModel] of Object.entries(xMap)) {
          await this.loadBlock(
            new Vector3(parseInt(x, 10), parseInt(y, 10), parseInt(z, 10)),
            blockModel, transform,
          );
        }
      }
    }
  }

  /**
   * Loads a block and adds it to the scene.
   * @param coordinates Local coordinates of the block.
   * @param blockModel Data about the block.
   * @param parent Parent transform node of the block.
   * @param scene Scene the block belongs to.
   */
  private static async loadBlock(
    coordinates: Vector3, blockModel: BlockDataModel, parent: TransformNode,
  ): Promise<void> {
    const materialName = Helpers.getMaterialName(blockModel.material);
    if (!materialName || materialName === 'minecraft:air' || materialName === 'minecraft:cave_air' || materialName === 'minecraft:void_air') {
      return;
    }

    const block = await BlockLoader.load(materialName, blockModel.data);

    if (!block) {
      return;
    }

    block.parent = parent;
    block.setPositionWithLocalVector(coordinates);
    block.freezeWorldMatrix();
  }
}
