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
  private static materialsMap: Map<number, string>;

  /**
   * The biomes map used to look up biome names.
   */
  private static biomesMap: Map<number, string>;

  /**
   * Gets the material name using an ordinal value.
   * @param ordinal Ordinal value for the material.
   * @returns Name of the material or undefined if the ordinal value is not in the materials map.
   */
  public static async getMaterialName(ordinal: number): Promise<string | undefined> {
    if (!this.materialsMap) {
      const response = await fetch('data/materials.json');
      if (!response.ok) {
        throw new Error('Unable to retrieve materials map.');
      }

      this.materialsMap = await response.json();
    }

    return this.materialsMap.get(ordinal);
  }

  /**
   * Gets the biome name using an ordinal value.
   * @param ordinal Ordinal value for the biome.
   * @returns Name of the biome or undefined if the ordinal value is not in the biomes map.
   */
  public static async getBiomeName(ordinal: number): Promise<string | undefined> {
    if (!this.biomesMap) {
      const response = await fetch('data/biomes.json');
      if (!response.ok) {
        throw new Error('Unable to retrieve biomes map.');
      }

      this.biomesMap = await response.json();
    }

    return this.materialsMap.get(ordinal);
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
