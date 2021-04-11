import { BackgroundMaterial } from '@babylonjs/core/Materials/Background/backgroundMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { InstancedMesh } from '@babylonjs/core/Meshes/instancedMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import BlockModel from './models/BlockModel';
import BlockState, { BlockStateModel } from './models/BlockState';

export default class BlockLoader {
  /**
   * Scene containing the blocks.
   */
  private static scene: Scene;

  /**
   * Record containing the base block transform nodes.
   */
  private static blocks: Record<string, TransformNode>;

  /**
   * Record containing the count of block clones.
   */
  private static blockCloneCount: Record<string, number>;

  /**
   * Record containing the base faces.
   */
  private static faces: Record<string, Mesh>;

  /**
   * Record containing the count of face instances.
   */
  private static faceInstanceCount: Record<string, number>;

  /**
   * Record containing loaded materials.
   */
  private static materials: Record<string, BackgroundMaterial>;

  /**
   * Sets the scene used by the block loader.
   * @param scene Scene containing the blocks.
   */
  public static setScene(scene: Scene): void {
    if (this.scene !== scene) {
      this.scene = scene;
      this.blocks = {};
      this.blockCloneCount = {};
      this.faces = {};
      this.faceInstanceCount = {};
      this.materials = {};
    }
  }

  /**
   * Loads a block into the scene.
   * @param materialName Material name for the block.
   * @param blockData Block data for the block.
   * @param coordinates Coordinates where the block will be placed.
   * @returns Promise to provide a TransformNode containing the loaded block.
   */
  public static async load(materialName: string, blockData?: string)
    : Promise<TransformNode | null> {
    if (!this.scene || this.scene.isDisposed) {
      throw new Error('The scene has not been set or has been disposed');
    }

    const blockName = blockData ? `${materialName}[${blockData}]` : materialName;

    if (blockName in this.blocks) {
      return this.blocks[blockName].clone(`${blockName}-${this.blockCloneCount[blockName]++}`, null);
    }

    const materialFileName = materialName.split(':').pop();
    const response = await fetch(`data/blockstates/${materialFileName}.json`);
    if (!response.ok) {
      throw new Error(`Unable to fetch block state for ${materialName}`);
    }
    const blockState: BlockState = await response.json();

    const tags = (blockData?.length ?? 0) === 0 ? [''] : blockData?.split(',') ?? [''];
    if (!tags.includes('')) {
      tags.push('');
    }

    if (blockState.variants) {
      const keys = Object.keys(blockState.variants);
      const tag = tags.find((value) => keys.includes(value));
      if (tag === undefined || tag === null) {
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

      const modelParent = new TransformNode(blockName, this.scene);

      if (model.elements) {
        for (const element of model.elements.values()) {
          const from = new Vector3(
            element.from[0],
            element.from[1],
            element.from[2],
          );
          const to = new Vector3(
            element.to[0],
            element.to[1],
            element.to[2],
          );

          for (const [name, face] of Object.entries(element.faces)) {
            let fromX: number;
            let toX: number;
            let fromY: number;
            let toY: number;
            let rotationAxis: Vector3;
            let rotationAmount: number;

            switch (name) {
              case 'north':
                fromX = from.x;
                toX = to.x;
                fromY = from.y;
                toY = to.y;
                rotationAxis = Vector3.Up();
                rotationAmount = Math.PI;
                break;

              case 'south':
                fromX = from.x;
                toX = to.x;
                fromY = from.y;
                toY = to.y;
                rotationAxis = Vector3.Up();
                rotationAmount = 0;
                break;

              case 'east':
                fromX = from.z;
                toX = to.z;
                fromY = from.y;
                toY = to.y;
                rotationAxis = Vector3.Up();
                rotationAmount = Math.PI / 2;
                break;

              case 'west':
                fromX = from.z;
                toX = to.z;
                fromY = from.y;
                toY = to.y;
                rotationAxis = Vector3.Up();
                rotationAmount = -Math.PI / 2;
                break;

              case 'up':
                fromX = from.x;
                toX = to.x;
                fromY = from.z;
                toY = to.z;
                rotationAxis = Vector3.Right();
                rotationAmount = Math.PI / 2;
                break;

              case 'down':
                fromX = from.x;
                toX = to.x;
                fromY = from.z;
                toY = to.z;
                rotationAxis = Vector3.Right();
                rotationAmount = -Math.PI / 2;
                break;

              default:
                fromX = 0;
                toX = 0;
                fromY = 16;
                toY = 16;
                rotationAxis = Vector3.Up();
                rotationAmount = 0;
            }

            const uv: number[] = new Array(4);

            if (face.uv) {
              for (let i = 0; i < 4; i++) {
                uv[i] = face.uv[i];
              }
            } else {
              uv[0] = fromX;
              uv[1] = fromY;
              uv[2] = toX;
              uv[3] = toY;
            }

            const width = toX - fromX;
            const height = toY - fromY;

            const textureLookup = face.texture.replace('#', '');

            if (!model.textures) {
              throw new Error('Model does not contain textures');
            }
            const texture = model.textures[textureLookup];

            const meshFace = this.createFace(texture, uv, width, height);
            meshFace.setParent(modelParent);
            meshFace.setPositionWithLocalVector(from);
            meshFace.rotate(rotationAxis, rotationAmount);
          }
        }
      }

      modelParent.scaling = new Vector3(1 / 16, 1 / 16, 1 / 16);
      this.blocks[blockName] = modelParent;
      this.blockCloneCount[blockName] = 0;
      return this.blocks[blockName].clone(`${blockName}-${this.blockCloneCount[blockName]++}`, null);
    }

    if (blockState.multipart) {
      return null;
    }

    return null;
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
   * Creates a face (plane) with the specified texture, width, and height.
   * @param textureUri Texture URI for the texture of the face.
   * @param width Width of the face.
   * @param height Height of the face.
   * @returns Created face instance.
   */
  private static createFace(
    textureUri: string, uv: number[], width: number, height: number,
  ): InstancedMesh {
    if (!this.scene || this.scene.isDisposed) {
      throw new Error('The scene has not been set or has been disposed');
    }

    const faceName = `${textureUri}[${uv[0]},${uv[1]},${uv[2]},${uv[3]}][${width},${height}]`;

    if (faceName in this.faces) {
      return this.faces[faceName].createInstance(`${faceName}-${this.faceInstanceCount[faceName]++}`);
    }

    const face = MeshBuilder.CreatePlane(faceName, { width, height });
    face.isVisible = false;
    const material = this.getMaterial(textureUri);
    face.material = material;
    const texture = material.diffuseTexture;

    if (texture) {
      const textureWidth = texture.getSize().width;
      const textureHeight = texture.getSize().height;

      const faceUV: number[] = new Array(4);
      faceUV[0] = uv[0] / textureWidth;
      faceUV[1] = uv[1] / textureHeight;
      faceUV[2] = uv[2] / textureWidth;
      faceUV[3] = uv[3] / textureHeight;
      face.setVerticesData(VertexBuffer.UVKind, faceUV);
    }

    this.faces[faceName] = face;
    this.faceInstanceCount[faceName] = 0;
    return this.faces[faceName].createInstance(`${faceName}-${this.faceInstanceCount[faceName]++}`);
  }

  /**
   * Gets a material.
   * @param textureUri URI of the texture for the material.
   * @returns Material.
   */
  private static getMaterial(textureUri: string): BackgroundMaterial {
    if (!this.scene || this.scene.isDisposed) {
      throw new Error('The scene has not been set or has been disposed');
    }

    if (textureUri in this.materials) {
      return this.materials[textureUri];
    }

    const textureFileName = textureUri.split('/').pop();
    const texture = new Texture(`data/textures/block/${textureFileName}.png`, this.scene, true, false, Texture.NEAREST_SAMPLINGMODE);
    texture.hasAlpha = true;
    this.materials[textureUri] = new BackgroundMaterial(textureUri, this.scene);
    this.materials[textureUri].diffuseTexture = texture;
    return this.materials[textureUri];
  }
}
