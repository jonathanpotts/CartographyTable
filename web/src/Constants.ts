/**
 * Constants used by BlockMaps.
 */
export default class Constants {
  /**
   * The width (x-axis) in blocks of a chunk.
   */
  static readonly WIDTH_OF_CHUNK: number = 16;

  /**
   * The depth (z-axis) in blocks of a chunk.
   */
  static readonly DEPTH_OF_CHUNK: number = 16;

  /**
   * The minimum value for a stored lighting level.
   */
  static readonly MIN_LIGHT_LEVEL: number = 0;

  /**
   * The maximum value for a stored lighting level.
   */
  static readonly MAX_LIGHT_LEVEL: number = 15;

  /**
   * Box faces.
   */
  static readonly FACES: Record<string, number> = {
    /**
     * North (+Z) face.
     */
    north: 0,

    /**
     * South (-Z) face.
     */
    south: 1,

    /**
     * East (+X) face.
     */
    east: 2,

    /**
     * West (-X) face.
     */
    west: 3,

    /**
     * Up (+Y) face.
     */
    up: 4,

    /**
     * Down (-Y) face.
     */
    down: 5,
  };
}
