import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager';
import { Material } from '@babylonjs/core/Materials/material';
import { BackgroundMaterial } from '@babylonjs/core/Materials/Background/backgroundMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
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
   * Cache of loaded textures.
   */
  private textures: Record<string, Texture>;

  /**
   * Cache of texture load promises.
   */
  private textureLoadPromises: Record<string, Promise<Texture>>;

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
    this.textures = {};
    this.textureLoadPromises = {};
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
      for (const child of clone.getChildMeshes(false)) {
        child.isVisible = true;
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
      models.push({ weight: stateModel.weight ?? 1, model: await this.generateModelAsync(model) });
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
   * @returns A promise for the generated model.
   */
  private async generateModelAsync(model: BlockModel): Promise<TransformNode> {
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
      const parent = new TransformNode('element');
      parent.parent = modelParent;
      for (const side in element.faces) {
        if (!Object.prototype.hasOwnProperty.call(element.faces, side)) {
          continue;
        }
        const face = element.faces[side];
        const textureLookup = face.texture.replace('#', '');
        if (!model.textures || !(textureLookup in model.textures)) {
          throw new Error('Texture not in model data');
        }
        const texture = model.textures[textureLookup];

        const positions: number[] = [];
        const uvs: number[] = face.uv ? [...face.uv] : [];

        switch (side) {
          case 'down': case 'bottom':
            positions.push(from.x, from.y, to.z);
            positions.push(to.x, from.y, to.z);
            positions.push(to.x, from.y, from.z);
            positions.push(from.x, from.y, from.z);

            if (!face.uv) {
              uvs.push(from.x, from.z, to.x, to.z);
            }
            break;

          case 'up':
            positions.push(to.x, to.y, to.z);
            positions.push(from.x, to.y, to.z);
            positions.push(from.x, to.y, from.z);
            positions.push(to.x, to.y, from.z);

            if (!face.uv) {
              uvs.push(from.x, from.z, to.x, to.z);
            }
            break;

          case 'north':
            positions.push(from.x, to.y, to.z);
            positions.push(to.x, to.y, to.z);
            positions.push(to.x, from.y, to.z);
            positions.push(from.x, from.y, to.z);

            if (!face.uv) {
              uvs.push(from.x, from.y, to.x, to.y);
            }
            break;

          case 'south':
            positions.push(to.x, to.y, from.z);
            positions.push(from.x, to.y, from.z);
            positions.push(from.x, from.y, from.z);
            positions.push(to.x, from.y, from.z);

            if (!face.uv) {
              uvs.push(from.x, from.y, to.x, to.y);
            }
            break;

          case 'west':
            positions.push(from.x, to.y, from.z);
            positions.push(from.x, to.y, to.z);
            positions.push(from.x, from.y, to.z);
            positions.push(from.x, from.y, from.z);

            if (!face.uv) {
              uvs.push(from.z, from.y, to.z, to.y);
            }
            break;

          case 'east':
            positions.push(to.x, to.y, to.z);
            positions.push(to.x, to.y, from.z);
            positions.push(to.x, from.y, from.z);
            positions.push(to.x, from.y, to.z);

            if (!face.uv) {
              uvs.push(from.z, from.y, to.z, to.y);
            }
            break;

          default:
            break;
        }

        const mesh = new Mesh(side, this.scene, parent);

        const indices = [
          0, 1, 2,
          2, 3, 0,
        ];
        const normals: number[] = [];
        VertexData.ComputeNormals(positions, indices, normals);

        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.uvs = [
          uvs[2], uvs[1],
          uvs[0], uvs[1],
          uvs[0], uvs[3],
          uvs[2], uvs[3],
        ];
        vertexData.applyToMesh(mesh);

        const material = new BackgroundMaterial(side, this.scene);
        material.diffuseTexture = await this.loadTextureAsync(texture);
        mesh.material = material;
        mesh.isVisible = false;
      }
    }

    return modelParent;
  }

  /**
   * Loads a texture.
   * @param texture URI of the texture to load.
   * @returns A promise for the loaded texture.
   */
  private async loadTextureAsync(texture: string): Promise<Texture> {
    if (texture in this.textures) {
      return this.textures[texture];
    }

    if (texture in this.textureLoadPromises) {
      return this.textureLoadPromises[texture];
    }

    const textureFileName = texture.split('/').pop();
    const assetsManager = new AssetsManager(this.scene);
    assetsManager.useDefaultLoadingScreen = false;
    const task = assetsManager.addTextureTask(texture, `data/textures/block/${textureFileName}.png`, true, false, Texture.NEAREST_SAMPLINGMODE);

    const loading = async () => {
      await assetsManager.loadAsync();
      task.texture.hasAlpha = true;
      task.texture.uScale = 1 / task.texture.getBaseSize().width;
      task.texture.vScale = 1 / task.texture.getBaseSize().height;
      this.textures[texture] = task.texture;
      return task.texture;
    };

    this.textureLoadPromises[texture] = loading();
    return this.textureLoadPromises[texture];
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
