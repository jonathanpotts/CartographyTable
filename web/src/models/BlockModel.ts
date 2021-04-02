/**
 * Stores data used to process a block.
 */
interface BlockModel {
  /**
   * Material ID ordinal.
   */
  material: number;

  /**
   * Additional block data.
   */
  data: string;

  /**
   * Sky light value.
   */
  skyLight: number;

  /**
   * Emitted light value.
   */
  emittedLight: number;

  /**
   * Temperature of the biome the block is in.
   */
  temperature: number;

  /**
   * Humidity of the biome the block is in.
   */
  humidity: number;

  /**
   * Biome the block is in.
   */
  biome: number;
}

export default BlockModel;
