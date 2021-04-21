import { Color4 } from '@babylonjs/core/Maths/math.color';

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

  /**
   * Water tint colors for biomes.
   */
  static readonly BIOME_WATER_COLORS: Readonly<Record<string, Color4>> = {
    DEFAULT: new Color4(0.25, 0.46, 0.89, 1),
  };

  /**
   * Tint color for birch leaves.
   */
  static readonly BIRCH_LEAVES_COLOR = new Color4(0.5, 0.65, 0.33, 1);

  /**
   * Tint color for spruce leaves.
   */
  static readonly SPRUCE_LEAVES_COLOR = new Color4(0.38, 0.6, 0.38, 1);

  /**
   * Tint color for lily pads.
   */
  static readonly LILY_PAD_COLOR = new Color4(0.13, 0.5, 0.19, 1);
}
