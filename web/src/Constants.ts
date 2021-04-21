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
   * Grass tint colors for biomes.
   */
  static readonly BIOME_GRASS_COLORS: Readonly<Record<string, Color4>> = {
    DEFAULT: new Color4(0.47, 0.75, 0.35, 1),
    BADLANDS: new Color4(0.56, 0.51, 0.3, 1),
    BADLANDS_PLATEAU: new Color4(0.56, 0.51, 0.3, 1),
    ERODED_BADLANDS: new Color4(0.56, 0.51, 0.3, 1),
    MODIFIED_BADLANDS_PLATEAU: new Color4(0.56, 0.51, 0.3, 1),
    MODIFIED_WOODED_BADLANDS_PLATEAU: new Color4(0.56, 0.51, 0.3, 1),
    WOODED_BADLANDS_PLATEAU: new Color4(0.56, 0.51, 0.3, 1),
    DESERT: new Color4(0.75, 0.72, 0.33, 1),
    DESERT_HILLS: new Color4(0.75, 0.72, 0.33, 1),
    DESERT_LAKES: new Color4(0.75, 0.72, 0.33, 1),
    SAVANNA: new Color4(0.75, 0.72, 0.33, 1),
    SAVANNA_PLATEAU: new Color4(0.75, 0.72, 0.33, 1),
    SHATTERED_SAVANNA: new Color4(0.75, 0.72, 0.33, 1),
    SHATTERED_SAVANNA_PLATEAU: new Color4(0.75, 0.72, 0.33, 1),
    NETHER_WASTES: new Color4(0.75, 0.72, 0.33, 1),
    SOUL_SAND_VALLEY: new Color4(0.75, 0.72, 0.33, 1),
    CRIMSON_FOREST: new Color4(0.75, 0.72, 0.33, 1),
    WARPED_FOREST: new Color4(0.75, 0.72, 0.33, 1),
    BASALT_DELTAS: new Color4(0.75, 0.72, 0.33, 1),
    JUNGLE: new Color4(0.35, 0.79, 0.24, 1),
    JUNGLE_HILLS: new Color4(0.35, 0.79, 0.24, 1),
    MODIFIED_JUNGLE: new Color4(0.35, 0.79, 0.24, 1),
    BAMBOO_JUNGLE: new Color4(0.35, 0.79, 0.24, 1),
    BAMBOO_JUNGLE_HILLS: new Color4(0.35, 0.79, 0.24, 1),
    JUNGLE_EDGE: new Color4(0.39, 0.78, 0.25, 1),
    MODIFIED_JUNGLE_EDGE: new Color4(0.39, 0.78, 0.25, 1),
    FOREST: new Color4(0.47, 0.75, 0.35, 1),
    FLOWER_FOREST: new Color4(0.47, 0.75, 0.35, 1),
    WOODED_HILLS: new Color4(0.47, 0.75, 0.35, 1),
    BIRCH_FOREST: new Color4(0.53, 0.73, 0.4, 1),
    BIRCH_FOREST_HILLS: new Color4(0.53, 0.73, 0.4, 1),
    TALL_BIRCH_FOREST: new Color4(0.53, 0.73, 0.4, 1),
    TALL_BIRCH_HILLS: new Color4(0.53, 0.73, 0.4, 1),
    DARK_FOREST: new Color4(0.31, 0.48, 0.2, 1),
    DARK_FOREST_HILLS: new Color4(0.31, 0.48, 0.2, 1),
    SWAMP: new Color4(0.42, 0.44, 0.22, 1),
    SWAMP_HILLS: new Color4(0.42, 0.44, 0.22, 1),
    PLAINS: new Color4(0.57, 0.74, 0.35, 1),
    SUNFLOWER_PLAINS: new Color4(0.57, 0.74, 0.35, 1),
    BEACH: new Color4(0.57, 0.74, 0.35, 1),
    OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    DEEP_OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    WARM_OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    DEEP_WARM_OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    LUKEWARM_OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    DEEP_LUKEWARM_OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    COLD_OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    DEEP_COLD_OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    DEEP_FROZEN_OCEAN: new Color4(0.56, 0.73, 0.44, 1),
    RIVER: new Color4(0.56, 0.73, 0.44, 1),
    THE_END: new Color4(0.56, 0.73, 0.44, 1),
    SMALL_END_ISLANDS: new Color4(0.56, 0.73, 0.44, 1),
    END_BARRENS: new Color4(0.56, 0.73, 0.44, 1),
    END_MIDLANDS: new Color4(0.56, 0.73, 0.44, 1),
    END_HIGHLANDS: new Color4(0.56, 0.73, 0.44, 1),
    THE_VOID: new Color4(0.56, 0.73, 0.44, 1),
    MUSHROOM_FIELDS: new Color4(0.33, 0.79, 0.25, 1),
    MUSHROOM_FIELD_SHORE: new Color4(0.33, 0.79, 0.25, 1),
    MOUNTAINS: new Color4(0.54, 0.71, 0.54, 1),
    MOUNTAIN_EDGE: new Color4(0.54, 0.71, 0.54, 1),
    GRAVELLY_MOUNTAINS: new Color4(0.54, 0.71, 0.54, 1),
    MODIFIED_GRAVELLY_MOUNTAINS: new Color4(0.54, 0.71, 0.54, 1),
    WOODED_MOUNTAINS: new Color4(0.54, 0.71, 0.54, 1),
    STONE_SHORE: new Color4(0.54, 0.71, 0.54, 1),
    SNOWY_BEACH: new Color4(0.51, 0.71, 0.58, 1),
    GIANT_TREE_TAIGA: new Color4(0.53, 0.72, 0.5, 1),
    GIANT_TREE_TAIGA_HILLS: new Color4(0.53, 0.72, 0.5, 1),
    TAIGA: new Color4(0.53, 0.72, 0.51, 1),
    TAIGA_HILLS: new Color4(0.53, 0.72, 0.51, 1),
    TAIGA_MOUNTAINS: new Color4(0.53, 0.72, 0.51, 1),
    GIANT_SPRUCE_TAIGA: new Color4(0.53, 0.72, 0.51, 1),
    GIANT_SPRUCE_TAIGA_HILLS: new Color4(0.53, 0.72, 0.51, 1),
    SNOWY_TUNDRA: new Color4(0.5, 0.71, 0.59, 1),
    SNOWY_MOUNTAINS: new Color4(0.5, 0.71, 0.59, 1),
    ICE_SPIKES: new Color4(0.5, 0.71, 0.59, 1),
    SNOWY_TAIGA: new Color4(0.5, 0.71, 0.59, 1),
    SNOWY_TAIGA_HILLS: new Color4(0.5, 0.71, 0.59, 1),
    SNOWY_TAIGA_MOUNTAINS: new Color4(0.5, 0.71, 0.59, 1),
    FROZEN_OCEAN: new Color4(0.5, 0.71, 0.59, 1),
    FROZEN_RIVER: new Color4(0.5, 0.71, 0.59, 1),
  };

  /**
   * Foilage tint colors for biomes.
   */
  static readonly BIOME_FOILAGE_COLORS: Readonly<Record<string, Color4>> = {
    DEFAULT: new Color4(0.35, 0.68, 0.19, 1),
  };

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
