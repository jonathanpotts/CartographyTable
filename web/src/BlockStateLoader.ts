import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import BlockModel from './models/BlockModel';
import BlockState from './models/BlockState';
import WeightedModel from './models/WeightedModel';
import BlockMaterial from './BlockMaterial';
import Constants from './Constants';
import BlockDataModel from './models/BlockDataModel';
import Helpers from './Helpers';

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
   * @param blockDataModel Block data model for the block.
   * @returns A promise for the loaded block state.
   */
  public async loadAsync(blockDataModel: BlockDataModel): Promise<TransformNode> {
    const materialName = Helpers.getMaterialName(blockDataModel.material);

    if (!materialName) {
      throw new Error('Unable to find material');
    }

    const blockData = blockDataModel.data;

    /*
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
    */

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

    if (blockState.multipart) {
      return (await this.loadMultipartAsync(blockDataModel, blockState, tags))[0].model;
    }

    return (await this.loadVariantAsync(blockDataModel, blockState, tags))[0].model;
  }

  /**
   * Loads block state variant.
   * @param blockDataModel Block data model for the block.
   * @param blockState Loaded block state.
   * @param tags Tags for the block state.
   * @returns A promise for the loaded block state variant.
   */
  private async loadVariantAsync(
    blockDataModel: BlockDataModel,
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
      models.push({
        weight: stateModel.weight ?? 1,
        model: await this.generateModelAsync(blockDataModel, model),
      });
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
   * @param blockDataModel Block data model for the block.
   * @param blockState Block state containing the multipart.
   * @param tags Data tags used to load the multipart.
   * @returns A promise for the loaded block state multipart.
   */
  private async loadMultipartAsync(
    blockDataModel: BlockDataModel,
    blockState: BlockState,
    tags: string[],
  ): Promise<WeightedModel[]> {
    throw new Error('Not implemented');
  }

  /**
   * Generates a model using the provided model data.
   * @param blockDataModel Block data model for the block.
   * @param model Model data.
   * @returns A promise for the generated model.
   */
  private async generateModelAsync(
    blockDataModel: BlockDataModel,
    model: BlockModel,
  ): Promise<TransformNode> {
    if (!model.elements) {
      throw new Error('There are no elements in this model');
    }

    const materialName = Helpers.getMaterialName(blockDataModel.material);

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

        if (!model.textures) {
          throw new Error('Texture not in model data');
        }

        let { texture } = face;

        while (texture.startsWith('#')) {
          const lookup = texture.replace('#', '');
          if (!(lookup in model.textures)) {
            throw new Error('Texture not in model data');
          }

          texture = model.textures[lookup];
        }

        const positions: number[] = [];
        const uvs: number[] = face.uv ? [...face.uv] : [];

        switch (side) {
          case 'down': case 'bottom':
            positions.push(from.x, from.y, to.z);
            positions.push(to.x, from.y, to.z);
            positions.push(to.x, from.y, from.z);
            positions.push(from.x, from.y, from.z);

            if (!face.uv) {
              uvs.push(element.from[0], element.from[2], element.to[0], element.to[2]);
            }
            break;

          case 'up':
            positions.push(to.x, to.y, to.z);
            positions.push(from.x, to.y, to.z);
            positions.push(from.x, to.y, from.z);
            positions.push(to.x, to.y, from.z);

            if (!face.uv) {
              uvs.push(element.from[0], element.from[2], element.to[0], element.to[2]);
            }
            break;

          case 'north':
            positions.push(from.x, to.y, to.z);
            positions.push(to.x, to.y, to.z);
            positions.push(to.x, from.y, to.z);
            positions.push(from.x, from.y, to.z);

            if (!face.uv) {
              uvs.push(element.from[0], element.from[1], element.to[0], element.to[1]);
            }
            break;

          case 'south':
            positions.push(to.x, to.y, from.z);
            positions.push(from.x, to.y, from.z);
            positions.push(from.x, from.y, from.z);
            positions.push(to.x, from.y, from.z);

            if (!face.uv) {
              uvs.push(element.from[0], element.from[1], element.to[0], element.to[1]);
            }
            break;

          case 'west':
            positions.push(from.x, to.y, from.z);
            positions.push(from.x, to.y, to.z);
            positions.push(from.x, from.y, to.z);
            positions.push(from.x, from.y, from.z);

            if (!face.uv) {
              uvs.push(element.from[2], element.from[1], element.to[2], element.to[1]);
            }
            break;

          case 'east':
            positions.push(to.x, to.y, to.z);
            positions.push(to.x, to.y, from.z);
            positions.push(to.x, from.y, from.z);
            positions.push(to.x, from.y, to.z);

            if (!face.uv) {
              uvs.push(element.from[2], element.from[1], element.to[2], element.to[1]);
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

        const loadedTexture = await this.loadTextureAsync(texture);
        uvs[0] /= loadedTexture.getBaseSize().width;
        uvs[1] /= loadedTexture.getBaseSize().height;
        uvs[2] /= loadedTexture.getBaseSize().width;
        uvs[3] /= loadedTexture.getBaseSize().height;

        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.uvs = [
          uvs[2], uvs[1],
          uvs[0], uvs[1],
          uvs[0], uvs[3],
          uvs[2], uvs[3],
        ];
        vertexData.applyToMesh(mesh);

        // materialName[elementIndex]-textureName
        const material = new BlockMaterial(side, this.scene);
        material.setTexture('diffuse', loadedTexture);

        if (face.tintindex !== undefined && face.tintindex !== null) {
          const tintBiome = blockDataModel.biome ?? 'DEFAULT';
          let tint: Color4;

          switch (materialName) {
            case 'minecraft:grass_block':
            case 'minecraft:grass':
            case 'minecraft:tall_grass':
            case 'minecraft:fern':
            case 'minecraft:large_fern':
            case 'minecraft:potted_fern':
            case 'minecraft:sugar_cane':
            default:
              tint = new Color4(1, 1, 1, 1);
              break;

            case 'minecraft:oak_leaves':
            case 'minecraft:dark_oak_leaves':
            case 'minecraft:jungle_leaves':
            case 'minecraft:acacia_leaves':
            case 'minecraft:vine':
              tint = new Color4(1, 1, 1, 1);
              break;

            case 'minecraft:water':
              tint = (tintBiome in Constants.BIOME_WATER_COLORS)
                ? Constants.BIOME_WATER_COLORS[tintBiome]
                : Constants.BIOME_WATER_COLORS.DEFAULT;
              break;

            case 'minecraft:birch_leaves':
              tint = Constants.BIRCH_LEAVES_COLOR;
              break;

            case 'minecraft:spruce_leaves':
              tint = Constants.SPRUCE_LEAVES_COLOR;
              break;

            case 'minecraft:lily_pad':
              tint = Constants.LILY_PAD_COLOR;
              break;
          }

          material.setTintColor(tint);
        }

        mesh.material = material;
        // mesh.isVisible = false;
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
