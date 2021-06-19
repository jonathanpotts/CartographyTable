package com.jonathanpotts.blockmaps.models;

/**
 * Stores a 2D vector containing a X and Z coordinate.
 */
public class VectorXZ {
  /**
   * X coordinate.
   */
  public int x;

  /**
   * Z coordinate.
   */
  public int z;

  /**
   * Creates a 2D vector containing a X and Z coordinate.
   *
   * @param x X coordinate.
   * @param z Z coordinate.
   */
  public VectorXZ(int x, int z) {
    this.x = x;
    this.z = z;
  }
}
