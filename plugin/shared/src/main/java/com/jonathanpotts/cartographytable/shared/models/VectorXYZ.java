package com.jonathanpotts.cartographytable.shared.models;

/**
 * Stores a 3D vector containing a X, Y, and Z coordinate.
 */
public class VectorXYZ {
  /**
   * X coordinate.
   */
  public int x;

  /**
   * Y coordinate.
   */
  public int y;

  /**
   * Z coordinate.
   */
  public int z;

  /**
   * Creates a 3D vector containing a X, Y, and Z coordinate.
   *
   * @param x X coordinate.
   * @param y Y coordinate.
   * @param z Z coordinate.
   */
  public VectorXYZ(int x, int y, int z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
