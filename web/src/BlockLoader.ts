import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import BlockModel from './models/BlockModel';
import BlockState, { BlockStateModel } from './models/BlockState';
import VectorXYZ from './models/VectorXYZ';

export default class BlockLoader {
  /**
   * Scene containing the blocks.
   */
  private static scene: Scene;

  /**
   * Record containing the parent blocks.
   */
  private static blocks: Record<string, Mesh>;

  /**
   * Sets the scene used by the block loader.
   * @param scene Scene containing the blocks.
   */
  public static setScene(scene: Scene): void {
    if (this.scene !== scene) {
      this.scene = scene;
      this.blocks = {};
    }
  }

  /**
   * Loads a block into the scene.
   * @param materialName Material name for the block.
   * @param blockData Block data for the block.
   * @param coordinates Coordinates where the block will be placed.
   */
  public static async load(materialName: string, blockData: string, coordinates: VectorXYZ)
  : Promise<AbstractMesh | undefined> {
    if (!this.scene || this.scene.isDisposed) {
      throw new Error('The scene has not been set or have been disposed');
    }

    const materialFileName = materialName.split(':').pop();
    const response = await fetch(`data/blockstates/${materialFileName}.json`);
    if (!response.ok) {
      throw new Error(`Unable to fetch block state for ${materialName}`);
    }
    const blockState: BlockState = await response.json();

    const tags = blockData?.length === 0 ? [''] : blockData.split(',');

    if (blockState.variants) {
      const tag = Object.keys(blockState.variants).find((value) => value in tags);
      if (!tag) {
        throw new Error('Unable to find a valid variant');
      }

      const variant = blockState.variants[tag];
      let option: BlockStateModel;

      if (Array.isArray(variant)) {
        [option] = variant;
      } else {
        option = variant;
      }

      const model = await this.getModel(option.model);
    }

    if (blockState.multipart) {
      return undefined;
    }

    return undefined;
  }

  /**
   * Gets a model with the parent data applied.
   * @param model URI of the model to get.
   * @returns Model after applying parent data.
   */
  private static async getModel(model: string): Promise<BlockModel> {
    const fileName = model.split('/').pop();
    const response = await fetch(`data/models/block/${fileName}.json`);
    if (!response.ok) {
      throw new Error(`Unable to load model ${model}`);
    }

    const blockModel: BlockModel = await response.json();

    if (!blockModel.parent) {
      return blockModel;
    }

    const parent = await this.getModel(blockModel.parent);

    if (blockModel.ambientocclusion) {
      parent.ambientocclusion = blockModel.ambientocclusion;
    }

    if (blockModel.textures) {
      for (const [key, value] of Object.entries(blockModel.textures)) {
        if (!parent.textures) {
          parent.textures = {};
        }

        parent.textures[key] = value;
      }
    }

    if (blockModel.elements) {
      parent.elements = blockModel.elements;
    }

    return parent;
  }
}
