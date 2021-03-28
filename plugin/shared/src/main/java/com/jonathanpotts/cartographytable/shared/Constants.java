package com.jonathanpotts.cartographytable.shared;

/**
 * Constants used by CartographyTable.
 */
public final class Constants {
  /**
   * The width (x-axis) in chunks of a region.
   */
  public static final int WIDTH_OF_REGION = 32;
  
  /**
   * The depth (z-axis) in chunks of a region.
   */
  public static final int DEPTH_OF_REGION = 32;

  /**
   * The width (x-axis) in blocks of a chunk.
   */
  public static final int WIDTH_OF_CHUNK = 16;

  /**
   * The depth (z-axis) in blocks of a chunk.
   */
  public static final int DEPTH_OF_CHUNK = 16;

  /**
   * The minimum value for a stored lighting level.
   */
  public static final int MIN_LIGHT_LEVEL = 0;

  /**
   * The maximum value for a stored lighting level.
   */
  public static final int MAX_LIGHT_LEVEL = 15;

  /**
   * The location of the Minecraft launcher version manifest file.
   */
  public static final String LAUNCHER_VERSION_MANIFEST = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

  /**
   * The notice for the Minecraft EULA.
   */
  public static final String MINECRAFT_LICENSE_NOTICE = "Use of this data is subject to the Minecraft EULA - "
      + "https://account.mojang.com/documents/minecraft_eula";
}
