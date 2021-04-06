package com.jonathanpotts.blockmaps.shared.models;

/**
 * Stores data used to process a block.
 */
public class BlockModel {
  /**
   * Material ID ordinal.
   */
  public Integer m;

  /**
   * Additional block data.
   */
  public String d;

  /**
   * Sky light value.
   */
  public Integer s;

  /**
   * Emitted light value.
   */
  public Integer e;

  /**
   * Temperature of the biome the block is in.
   */
  public Double t;

  /**
   * Humidity of the biome the block is in.
   */
  public Double h;

  /**
   * Biome the block is in.
   */
  public Integer b;
}
