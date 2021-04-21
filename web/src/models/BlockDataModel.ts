/**
 * Stores data used to process a block.
 */
interface BlockDataModel {
  /**
   * Material ID ordinal.
   */
  material: number;

  /**
   * Additional block data.
   */
  data?: string;

  /**
   * Sky light value.
   */
  skyLight?: number;

  /**
   * Emitted light value.
   */
  emittedLight?: number;

  /**
   * Biome containing the block.
   */
  biome?: number;

  /**
   * Temperature at the block.
   */
  temperature?: number;

  /**
   * Humidity at the block.
   */
  humidity?: number;
}

export default BlockDataModel;
