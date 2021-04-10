import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Vector4 } from '@babylonjs/core/Maths/math.vector';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Scene } from '@babylonjs/core/scene';
import Constants from './Constants';
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
   * Record containing loaded textures.
   */
  private static textures: Record<string, Texture>;

  /**
   * Sets the scene used by the block loader.
   * @param scene Scene containing the blocks.
   */
  public static setScene(scene: Scene): void {
    if (this.scene !== scene) {
      this.scene = scene;
      this.blocks = {};
      this.textures = {};
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

      if (model.elements) {
        for (const [index, element] of model.elements.entries()) {
          const from: VectorXYZ = { x: element.from[0], y: element.from[1], z: element.from[2] };
          const to: VectorXYZ = { x: element.to[0], y: element.to[1], z: element.to[2] };

          const width = (to.x - from.x) / 16;
          const height = (to.y - from.y) / 16;
          const depth = (to.z - from.z) / 16;

          const textures: Set<string> = new Set();
          for (const face of Object.values(element.faces)) {
            textures.add(face.texture);
          }

          if (textures.size <= 1) {
            const texture = this.getModelTexture(model, textures.values().next().value);
            const faceUV: Vector4[] = new Array(6);
            for (let i = 0; i < 6; i++) {
              faceUV[i] = new Vector4(
                from.x / 16,
                from.y / 16,
                to.x / 16,
                to.y / 16,
              );
            }

            for (const [name, face] of Object.entries(element.faces)) {
              if (face.uv) {
                const textureWidth = texture.getSize().width;
                const textureHeight = texture.getSize().height;

                faceUV[Constants.FACES[name]] = new Vector4(
                  face.uv[0] / textureWidth,
                  face.uv[1] / textureHeight,
                  face.uv[2] / textureWidth,
                  face.uv[3] / textureHeight,
                );
              }
            }
          }
        }
      }
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

  /**
   * Gets a texture from a model's texture reference.
   * @param model Model containing the texture reference.
   * @param texture Texture reference.
   * @returns Texture.
   */
  private static getModelTexture(model: BlockModel, texture: string): Texture {
    if (!model.textures) {
      throw new Error('The model does not contain textures');
    }

    const textureName = texture.replace('#', '');
    if (!(textureName in model.textures)) {
      throw new Error('The texture does not exist in model');
    }

    return this.getTexture(model.textures[textureName]);
  }

  /**
   * Gets a texture.
   * @param texture URI of the texture to get.
   * @returns Texture.
   */
  private static getTexture(texture: string): Texture {
    if (!this.scene || this.scene.isDisposed) {
      throw new Error('The scene has not been set or have been disposed');
    }

    if (texture in this.textures) {
      return this.textures[texture];
    }

    const textureFileName = texture.split('/').pop();
    this.textures[texture] = new Texture(`data/textures/block/${textureFileName}.png`, this.scene, true, false, Texture.NEAREST_SAMPLINGMODE);
    return this.textures[texture];
  }
}
