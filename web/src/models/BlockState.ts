/**
 * A block state model.
 */
export interface BlockStateModel {
  /**
   * URI of the model.
   */
  model: string;

  /**
   * Rotate the model on the X-axis.
   */
  x?: number;

  /**
   * Rotate the model on the Y-axis.
   */
  y?: number;

  /**
   * Lock the UV rotation of the model.
   */
  uvlock?: boolean;

  /**
   * Weight of the model.
   */
  weight?: number;
}

/**
 * Multi-part data belonging to a block state.
 */
export interface MultiPart {
  /**
   * When to apply the model.
   */
  when: Record<string, string>;

  /**
   * The model to apply.
   */
  apply: BlockStateModel | BlockStateModel[];
}

/**
 * Stores data regarding block states.
 */
interface BlockState {
  /**
   * Variants of the block state.
   */
  variants?: Record<string, BlockStateModel | BlockStateModel[]>;

  /**
   * Multi-part data for the block state.
   */
  multipart?: MultiPart[];
}

export default BlockState;
