import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { SubMesh } from '@babylonjs/core/Meshes/subMesh';
import { MultiMaterial } from '@babylonjs/core/Materials/multiMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import BlockModel from './models/BlockModel';
import BlockState, { BlockStateModel } from './models/BlockState';
import WeightedModel from './models/WeightedModel';
import BlockMaterial from './BlockMaterial';
import BlockDataModel from './models/BlockDataModel';
import Helpers from './Helpers';

/**
 * Loads and processes block states.
 */
export default class BlockStateLoader {
  /**
   * Cache of created materials.
   */
  private materials: Record<string, BlockMaterial>;

  /**
   * Cache of created multi-materials.
   */
  private multiMaterials: Record<string, MultiMaterial>;

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
  private blockStates: Record<string, WeightedModel[][]>;

  /**
   * Creates a block state loader.
   * @param scene Scene to load blocks into.
   */
  public constructor(private scene: Scene) {
    this.materials = {};
    this.multiMaterials = {};
    this.textures = {};
    this.textureLoadPromises = {};
    this.blockStates = {};
  }

  /**
   * Load a block state.
   * @param blockDataModel Block data model for the block.
   * @returns A promise for the loaded block state.
   */
  public async loadAsync(blockDataModel: BlockDataModel): Promise<Mesh> {
    const materialName = Helpers.getMaterialName(blockDataModel.material);

    if (!materialName) {
      throw new Error('Unable to find material');
    }

    const blockData = blockDataModel.data;
    const blockStateName = blockData ? `${materialName}[${blockData}]` : materialName;

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
      const models = await this.loadMultipartAsync(blockDataModel, blockState, tags);
      this.blockStates[blockStateName] = models;
      return models[0][0].model;
    }

    const models = await this.loadVariantAsync(blockDataModel, blockState, tags);
    this.blockStates[blockStateName] = models;
    return models[0][0].model;
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
  ): Promise<WeightedModel[][]> {
    if (!blockState.variants) {
      throw new Error('Tried to load variants from a block state that does not contain variants');
    }

    const { variants } = blockState;
    const tag = tags.find((value) => Object.keys(variants).includes(value));
    if (tag === undefined || tag === null) {
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

    return [models];
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
  ): Promise<WeightedModel[][]> {
    if (!blockState.multipart) {
      throw new Error('Tried to load multiparts from a block state that does not contain multiparts');
    }

    const { multipart } = blockState;

    const tagConditions: Record<string, string> = {};
    for (const tag of tags) {
      const [condition, value] = tag.split('=');
      tagConditions[condition] = value;
    }

    const models: WeightedModel[][] = [];
    for (const part of multipart) {
      let valid = true;
      if (part.when) {
        for (const condition in part.when) {
          if (!(condition in tagConditions && tagConditions[condition] in part.when[condition].split('|'))) {
            valid = false;
            break;
          }
        }
      }

      if (!valid) {
        continue;
      }

      const stateModels: BlockStateModel[] = [];
      if (Array.isArray(part.apply)) {
        stateModels.push(...part.apply);
      } else {
        stateModels.push(part.apply);
      }

      const partModels: WeightedModel[] = [];
      for (const stateModel of stateModels) {
        const model = await this.loadModelAsync(stateModel.model);
        partModels.push({
          weight: stateModel.weight ?? 1,
          model: await this.generateModelAsync(blockDataModel, model),
        });
      }

      models.push(partModels);

      // Normalize the weights
      let weightTotal = 0;
      for (const model of partModels) {
        weightTotal += model.weight;
      }
      for (const model of partModels) {
        model.weight /= weightTotal;
      }
    }

    return models;
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
  ): Promise<Mesh> {
    if (!model.elements) {
      throw new Error('There are no elements in this model');
    }

    const scale = 1 / 16;

    const elementMeshes: Mesh[] = [];

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

      const faceMeshes: Mesh[] = [];

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

        const mesh = new Mesh(side, this.scene);

        /*
        if (face.cullface) {
          Tags.EnableFor(mesh);
          Tags.AddTagsTo(mesh, `cullface-${face.cullface}`);
        }
        */

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

        const material = this.getMaterial(loadedTexture);
        mesh.material = material;

        faceMeshes.push(mesh);
      }

      const elementMesh = this.mergeMeshes('element', faceMeshes);
      elementMeshes.push(elementMesh);
    }

    return this.mergeMeshes('model', elementMeshes);
  }

  /**
   * Merges meshes together into a single mesh.
   * @param name Name of the merged mesh.
   * @param meshes Meshes to merge.
   * @returns Merged mesh.
   */
  private mergeMeshes(name: string, meshes: Mesh[]): Mesh {
    const subMeshData: {
      materialIndex: number,
      verticesCount: number,
      indicesCount: number,
    }[] = [];

    const subMaterials: (Material | null)[] = [];
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (const mesh of meshes) {
      const verticesCount = positions.length / 3;

      const positionData = mesh.getVerticesData(VertexBuffer.PositionKind);
      if (!positionData) {
        throw new Error('Unable to get position data for mesh');
      }

      for (const position of positionData) {
        positions.push(position);
      }

      const indicesData = mesh.getIndices();
      if (!indicesData) {
        throw new Error('Unable to get indices data for mesh');
      }

      for (const index of indicesData) {
        indices.push(index + verticesCount);
      }

      const uvData = mesh.getVerticesData(VertexBuffer.UVKind);
      if (!uvData) {
        throw new Error('Unable to get UV data for mesh');
      }

      for (const uv of uvData) {
        uvs.push(uv);
      }

      for (const subMesh of mesh.subMeshes) {
        const subMeshMaterial = mesh.material instanceof MultiMaterial
          ? mesh.material.subMaterials[subMesh.materialIndex]
          : mesh.material;

        let materialIndex = subMaterials.indexOf(subMeshMaterial);

        if (materialIndex < 0) {
          materialIndex = subMaterials.push(subMeshMaterial) - 1;
        }

        subMeshData.push({
          materialIndex,
          verticesCount: mesh.getTotalVertices(),
          indicesCount: mesh.getTotalIndices(),
        });
      }

      mesh.dispose();
    }

    const mesh = new Mesh(name, this.scene);

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.uvs = uvs;
    vertexData.applyToMesh(mesh);

    let verticesIndex = 0;
    let indicesIndex = 0;

    for (const subMesh of subMeshData) {
      new SubMesh(
        subMesh.materialIndex,
        verticesIndex,
        subMesh.verticesCount,
        indicesIndex,
        subMesh.indicesCount,
        mesh,
      );

      verticesIndex += subMesh.verticesCount;
      indicesIndex += subMesh.indicesCount;
    }

    if (subMaterials.length === 1) {
      [mesh.material] = subMaterials;
    } else {
      const multiMaterial = this.getMultiMaterial(subMaterials);
      mesh.material = multiMaterial;

      for (const subMesh of mesh.subMeshes) {
        subMesh.materialIndex = multiMaterial.subMaterials
          .indexOf(subMaterials[subMesh.materialIndex]);
      }
    }

    return mesh;
  }

  /**
   * Gets a multi-material.
   * @param subMaterials Materials contained in the multi-material.
   * @returns The multi-material.
   */
  private getMultiMaterial(subMaterials: (Material | null)[]): MultiMaterial {
    const name = subMaterials.sort((a, b) => (a?.name ?? 'null').localeCompare(b?.name ?? 'null')).map((m) => m?.name ?? 'null').join(',');

    if (name in this.multiMaterials) {
      return this.multiMaterials[name];
    }

    const material = new MultiMaterial(name, this.scene);
    material.subMaterials = subMaterials;

    this.multiMaterials[name] = material;
    return material;
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
      task.texture.name = texture;
      task.texture.hasAlpha = true;
      this.textures[texture] = task.texture;
      return task.texture;
    };

    this.textureLoadPromises[texture] = loading();
    return this.textureLoadPromises[texture];
  }

  /**
   * Gets a material.
   * @param texture Texture to use for the material.
   * @param tintColor Tint color to use for the material.
   * @param light Light level to use for the material.
   * @returns The material.
   */
  private getMaterial(texture: Texture, tintColor?: Color4, light?: number): Material {
    let materialData = '';
    if (tintColor !== undefined && tintColor !== null) {
      materialData += `tint=${tintColor.toHexString}`;
    }

    if (light !== undefined && light !== null) {
      if (materialData.length > 0) {
        materialData += ',';
      }

      materialData += `light=${light}`;
    }

    if (materialData.length > 0) {
      materialData = `[${materialData}]`;
    }

    const materialName = `${texture.name}${materialData}`;

    if (materialName in this.materials) {
      return this.materials[materialName];
    }

    const material = new BlockMaterial(materialName, this.scene);
    material.setDiffuseTexture(texture);

    if (tintColor !== undefined && tintColor !== null) {
      material.setTintColor(tintColor);
    }

    if (light !== undefined && light !== null) {
      material.setLightLevel(light);
    }

    this.materials[materialName] = material;
    return material;
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
