package com.jonathanpotts.blockmaps.shared.models;

/**
 * Stores data used to process a block.
 */
public class BlockModel {
  /**
   * Material ID ordinal.
   */
  public int material;

  /**
   * Additional block data.
   */
  public String data;

  /**
   * Sky light value.
   */
  public int skyLight = -1;

  /**
   * Emitted light value.
   */
  public int emittedLight = -1;

  /**
   * Temperature of the biome the block is in.
   */
  public double temperature;

  /**
   * Humidity of the biome the block is in.
   */
  public double humidity;

  /**
   * Biome the block is in.
   */
  public int biome;
}
