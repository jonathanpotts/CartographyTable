import { BackgroundMaterial, PlaneBuilder, Texture } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
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

    const createClone = (): TransformNode => {
      const clone = this.blockStates[blockStateName][0].model.clone(blockStateName, null);
      if (!clone) {
        throw new Error('Unable to create a clone');
      }
      return clone;
    };

    if (blockStateName in this.blockStates) {
      return createClone();
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
      this.blockStates[blockStateName] = await this.loadVariantAsync(blockState, tags);
    } else if (blockState.multipart) {
      this.blockStates[blockStateName] = await this.loadMultipartAsync(blockState, tags);
    }

    return createClone();
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
      models.push({ weight: stateModel.weight ?? 1, model: this.generateModel(model) });
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
   * Loads block state multipart.
   * @param blockState Block state containing the multipart.
   * @param tags Data tags used to load the multipart.
   * @returns A promise for the loaded block state multipart.
   */
  private async loadMultipartAsync(
    blockState: BlockState,
    tags: string[],
  ): Promise<WeightedModel[]> {
    throw new Error('Not implemented');
  }

  /**
   * Generates a model using the provided model data.
   * @param model Model data.
   * @returns Generated model.
   */
  private generateModel(model: BlockModel): TransformNode {
    if (!model.elements) {
      throw new Error('There are no elements in this model');
    }

    const scale = 1 / 16;
    const modelParent = new TransformNode('model');
    for (const element of model.elements) {
      const from = new Vector3(
        element.from[0],
        element.from[1],
        element.from[2],
      ).scale(scale);
      const to = new Vector3(
        element.to[0],
        element.to[1],
        element.to[2],
      ).scale(scale);
      const size = to.subtract(from);
      const parent = new TransformNode('element');
      parent.parent = modelParent;
      for (const side in element.faces) {
        if (!Object.prototype.hasOwnProperty.call(element.faces, side)) {
          continue;
        }
        const face = element.faces[side];
        const texture = face.texture.replace('#', '');
        const textureFileName = texture.split('/').pop();

        let width: number;
        let height: number;
        let position: Vector3;
        let rotation: Vector3;
        switch (side) {
          case 'down': case 'bottom':
            width = size.x;
            height = size.z;
            position = from;
            rotation = new Vector3(Math.PI / 2, 0, Math.PI);
            break;
          case 'up':
            width = size.x;
            height = size.z;
            position = to;
            rotation = new Vector3((3 * Math.PI) / 2, 0, Math.PI);
            break;
          case 'north':
            width = size.x;
            height = size.y;
            position = to;
            rotation = new Vector3(Math.PI, 0, 0);
            break;
          case 'south':
            width = size.x;
            height = size.y;
            position = from;
            rotation = Vector3.Zero();
            break;
          case 'west':
            width = size.z;
            height = size.y;
            position = from;
            rotation = new Vector3(0, Math.PI / 2, 0);
            break;
          case 'east':
            width = size.z;
            height = size.y;
            position = to;
            rotation = new Vector3(0, (3 * Math.PI) / 2, 0);
            break;
          default:
            width = 1;
            height = 1;
            position = Vector3.Zero();
            rotation = Vector3.Zero();
            break;
        }
        const plane = PlaneBuilder.CreatePlane(side, { width, height });
        plane.parent = parent;
        plane.position = position;
        plane.rotation = rotation;
        const material = new BackgroundMaterial(side, this.scene);
        material.diffuseTexture = new Texture(`data/textures/block/${textureFileName}.png`, this.scene, true, true, Texture.NEAREST_SAMPLINGMODE);
        plane.material = material;
      }
    }

    return modelParent;
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
