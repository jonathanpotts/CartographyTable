import Constants from './Constants';
import VectorXYZ from './models/VectorXYZ';
import VectorXZ from './models/VectorXZ';

/**
 * Helpers used for processing data.
 */
export default class Helpers {
  /**
   * The materials map used to look up material names.
   */
  private static materialsMap: Record<number, string>;

  /**
   * The biomes map used to look up biome names.
   */
  private static biomesMap: Record<number, string>;

  /**
   * Loads data used by the helper methods.
   */
  public static async loadAsync(): Promise<void> {
    if (!this.materialsMap) {
      const materialsResponse = await fetch('data/materials.json');
      if (!materialsResponse.ok) {
        throw new Error('Unable to retrieve materials map.');
      }

      this.materialsMap = await materialsResponse.json();
    }

    if (!this.biomesMap) {
      const biomesResponse = await fetch('data/biomes.json');
      if (!biomesResponse.ok) {
        throw new Error('Unable to retrieve biomes map.');
      }

      this.biomesMap = await biomesResponse.json();
    }
  }

  /**
   * Gets the material name using an ordinal value.
   * @param ordinal Ordinal value for the material.
   * @returns Name of the material or undefined if the ordinal value is not in the materials map.
   */
  public static getMaterialName(ordinal: number): string | undefined {
    if (!this.materialsMap) {
      throw new Error('The helper data was not loaded.');
    }

    return this.materialsMap[ordinal];
  }

  /**
   * Gets the biome name using an ordinal value.
   * @param ordinal Ordinal value for the biome.
   * @returns Name of the biome or undefined if the ordinal value is not in the biomes map.
   */
  public static getBiomeName(ordinal: number): string | undefined {
    if (!this.biomesMap) {
      throw new Error('The helper data was not loaded.');
    }

    return this.biomesMap[ordinal];
  }

  /**
   * Gets the coordinates of the chunk containing the specified block coordinates.
   * @param blockCoordinates Coordinates of the block.
   * @returns Coordinates of the chunk containing the block.
   */
  public static getChunkCoordinates(blockCoordinates: VectorXYZ): VectorXZ {
    const x = Math.floor(blockCoordinates.x / Constants.WIDTH_OF_CHUNK);
    const z = Math.floor(blockCoordinates.z / Constants.DEPTH_OF_CHUNK);

    return { x, z };
  }
}
