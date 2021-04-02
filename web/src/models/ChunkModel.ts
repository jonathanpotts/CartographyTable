import BlockModel from './BlockModel';

/**
 * Stores data used to process a chunk.
 */
interface ChunkModel {
  /**
   * A map of coordinates to block models (YXZ format).
   */
  blocks: Map<number, Map<number, Map<number, BlockModel>>>;
}

export default ChunkModel;
