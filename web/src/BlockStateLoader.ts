import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import BlockState from './models/BlockState';

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
  private blockStates: Record<string, TransformNode[]>;

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
  ): Promise<TransformNode | null> {
    const blockStateName = blockData ? `${materialName}[${blockData}]` : materialName;

    if (blockStateName in this.blockStates) {
      return this.blockStates[blockStateName][0].clone(blockStateName, null);
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

    return null;
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
  ): Promise<TransformNode[] | null> {
    if (!blockState.variants) {
      return null;
    }

    const { variants } = blockState;
    const tag = tags.find((value) => Object.keys(variants).includes(value));
    if (tag === undefined || tag === null || !(tag in variants)) {
      return null;
    }

    const match = variants[tag];
    const stateModels = Array.isArray(match) ? match : [match];

    return null;
  }
}
