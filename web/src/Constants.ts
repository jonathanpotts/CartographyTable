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
   * The maximum value for brightness.
   */
  static readonly MAX_BRIGHTNESS: number = 0.98;

  /**
   * The minimum value for brightness in the overworld.
   */
  static readonly OVERWORLD_MIN_BRIGHTNESS: number = 0.05;

  /**
   * The minimum value for brightness in the nether.
   */
  static readonly NETHER_MIN_BRIGHTNESS: number = 0.25;

  /**
   * The minimum value for brightness in the end.
   */
  static readonly THEEND_MIN_BRIGHTNESS: number = 0.28;
}
