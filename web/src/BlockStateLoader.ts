import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import BlockModel from './models/BlockModel';
import BlockState from './models/BlockState';
import WeightedModel from './models/WeightedModel';

export default class BlockStateLoader {
  /**
   * Scene to load blocks into.
   */
  private scene: Scene;

  /**
   * Cache of faces created with materials.
   */
  private materialFaces: Record<string, Mesh>;

  /**
   * Cache of loaded block states.
   */
  private blockStates: Record<string, WeightedModel[]>;

  /**
   * Creates a block state loader.
   * @param scene Scene to load blocks into.
   */
  public constructor(scene: Scene) {
    this.scene = scene;
    this.materialFaces = {};
    this.blockStates = {};
  }

  /**
   * Load a block state.
   * @param materialName Name of the block state material.
   * @param blockData Additional block data.
   * @returns A promise for the loaded block state.
   */
  public async loadAsync(
    materialName: string,
    blockData?: string,
  ): Promise<TransformNode> {
    const blockStateName = blockData ? `${materialName}[${blockData}]` : materialName;

    if (blockStateName in this.blockStates) {
      const clone = this.blockStates[blockStateName][0].model.clone(blockStateName, null);
      if (!clone) {
        throw new Error('Unable to create a clone');
      }
      return clone;
    }

    const blockStateFile = materialName.split(':').pop();
    const response = await fetch(`data/blockstates/${blockStateFile}.json`);
    if (!response.ok) {
      throw new Error(`Unable to fetch block state for ${materialName}`);
    }
    const blockState: BlockState = await response.json();

    const tags = blockData ? blockData.split(',') : [''];
    if (!tags.includes('')) {
      tags.push('');
    }

    if (blockState.variants) {
      const variant = await this.loadVariantAsync(blockState, tags);
    }

    return new TransformNode('test');
  }

  /**
   * Loads block state variant.
   * @param blockState Block state containing the variant.
   * @param tags Data tags to use to load the variant.
   * @returns A promise for the loaded block state variant.
   */
  private async loadVariantAsync(
    blockState: BlockState,
    tags: string[],
  ): Promise<WeightedModel[]> {
    if (!blockState.variants) {
      throw new Error('Tried to load variants from a block state that does not contain variants');
    }

    const { variants } = blockState;
    const tag = tags.find((value) => Object.keys(variants).includes(value));
    if (tag === undefined || tag === null || !(tag in variants)) {
      throw new Error('The block state does not contain a variant that matches the block data');
    }

    const match = variants[tag];
    const stateModels = Array.isArray(match) ? match : [match];

    const models: WeightedModel[] = [];

    for (const stateModel of stateModels) {
      const model = await this.loadModelAsync(stateModel.model);

      models.push({ weight: stateModel.weight ?? 1, model: new TransformNode('model') });
    }

    // Normalize the weights
    let weightTotal = 0;
    for (const model of models) {
      weightTotal += model.weight;
    }
    for (const model of models) {
      model.weight /= weightTotal;
    }

    return models;
  }

  /**
   * Loads a model and populates all parent data.
   * @param model Model URI to load.
   * @returns A promise for the loaded model.
   */
  private async loadModelAsync(model: string): Promise<BlockModel> {
    const modelFileName = model.split('/').pop();
    const response = await fetch(`data/models/block/${modelFileName}.json`);
    if (!response.ok) {
      throw new Error(`Unable to fetch model ${model}`);
    }
    const modelObj: BlockModel = await response.json();

    if (modelObj.parent) {
      const parent = await this.loadModelAsync(modelObj.parent);

      if (modelObj.ambientocclusion !== undefined && modelObj.ambientocclusion !== null) {
        parent.ambientocclusion = modelObj.ambientocclusion;
      }

      if (modelObj.textures) {
        if (!parent.textures) {
          parent.textures = {};
        }

        for (const [name, texture] of Object.entries(modelObj.textures)) {
          parent.textures[name] = texture;
        }
      }

      if (modelObj.elements) {
        parent.elements = modelObj.elements;
      }

      return parent;
    }

    return modelObj;
  }
}
