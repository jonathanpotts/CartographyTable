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
   * Biome the block is in.
   */
  biome: number;
}

export default BlockModel;
