package com.jonathanpotts.blockmaps.models;

import java.util.List;

/**
 * Stores data used to process a server.
 */
public class ServerModel {
  /**
   * Message of the day on the server.
   */
  public String motd;

  /**
   * Worlds on the server.
   */
  public List<WorldModel> worlds;
}
