package com.jonathanpotts.blockmaps.shared.models;

/**
 * Stores data used to process a block.
 */
public class BlockModel {
  /**
   * Material ID ordinal.
   */
  public Integer material;

  /**
   * Additional block data.
   */
  public String data;

  /**
   * Sky light value.
   */
  public Integer skyLight;

  /**
   * Emitted light value.
   */
  public Integer emittedLight;

  /**
   * Biome the block is in.
   */
  public Integer biome;
}
