package com.jonathanpotts.blockmaps.models;

/**
 * Stores data used to process a block.
 */
public class BlockDataModel {
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
   * Biome containing the block.
   */
  public Integer biome;

  /**
   * Temperature at the block.
   */
  public Double temperature;

  /**
   * Humidity at the block.
   */
  public Double humidity;
}
