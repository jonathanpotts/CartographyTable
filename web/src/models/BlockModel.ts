/**
 * Stores data used to process a block.
 */
interface BlockModel {
  /**
   * Material ID ordinal.
   */
  m: number;

  /**
   * Additional block data.
   */
  d: string;

  /**
   * Sky light value.
   */
  s: number;

  /**
   * Emitted light value.
   */
  e: number;

  /**
   * Temperature of the biome the block is in.
   */
  t: number;

  /**
   * Humidity of the biome the block is in.
   */
  h: number;

  /**
   * Biome the block is in.
   */
  b: number;
}

export default BlockModel;
