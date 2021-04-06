import BlockModel from './BlockModel';

/**
 * Stores data used to process a chunk.
 */
interface ChunkModel {
  /**
   * A record of coordinates to block models (YXZ format).
   */
  blocks: Record<number, Record<number, Record<number, BlockModel>>>;
}

export default ChunkModel;
