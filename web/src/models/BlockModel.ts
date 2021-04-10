/**
 * The rotation of a block model element.
 */
export interface BlockModelRotation {
  /**
   * The origin (pivot) of the rotation: [x, y, z].
   */
  origin: number[],

  /**
   * The axis to rotate by.
   */
  axis: string,

  /**
   * The angle to rotate by (-45 to 45 degrees with 22.5 increments).
   */
  angle: number,

  /**
   * Determines if the faces should be scaled around the whole block.
   */
  rescale?: boolean
}

/**
 * A face of a block model element.
 */
export interface BlockModelFace {
  /**
   * The UV of the face: [x1, y1, x2, y2].
   */
  uv?: number[];

  /**
   * The name of the texture to use for the face.
   */
  texture: string;

  /**
   * Allows the face to be culled if there is a block in the specified direction.
   */
  cullface?: string;

  /**
   * The rotation of the texture in degrees (90 degree increments).
   */
  rotation?: number;

  /**
   * Determines if the texture is tinted with a hardcoded tint value.
   * If provided, then the block is tinted.
   */
  tintindex?: number;
}

/**
 * An element of a block model.
 */
export interface BlockModelElement {
  /**
   * The starting point of the elements's cube: [x, y, z] (-16 to 32).
   */
  from: number[];

  /**
   * The ending point of the elements's cube: [x, y, z] (-16 to 32).
   */
  to: number[];

  /**
   * The rotation of the element.
   */
  rotation: BlockModelRotation;

  /**
   * Determines if the element receives shadows.
   */
  shade?: boolean;

  /**
   * The faces of the element.
   */
  faces: Record<string, BlockModelFace>;
}

/**
 * A model used for rendering a block.
 */
interface BlockModel {
  /**
   * The parent model.
   */
  parent?: string;

  /**
   * Determines if ambient occlusion is used when rendering the block.
   */
  ambientocclusion?: boolean;

  /**
   * Textures to use for the block.
   */
  textures?: Record<string, string>;

  /**
   * Elements of the block. Overrides data from the parent model if provided.
   */
  elements?: BlockModelElement[];
}

export default BlockModel;
