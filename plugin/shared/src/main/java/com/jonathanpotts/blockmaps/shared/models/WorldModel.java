package com.jonathanpotts.blockmaps.shared.models;

/**
 * Stores data needed to process a world.
 */
public class WorldModel {
  /**
   * The name of the world.
   */
  public String name;

  /**
   * The spawn point of the world.
   */
  public VectorXYZ spawn;

  /**
   * The minimum height of the world.
   */
  public int minHeight;

  /**
   * The maximum height of the world.
   */
  public int maxHeight;
}
