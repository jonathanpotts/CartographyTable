package com.jonathanpotts.cartographytable.spigot;

import org.bukkit.plugin.java.JavaPlugin;

/**
 * The CartographyTable server plugin.
 */
public class CartographyTable extends JavaPlugin {
  @Override
  public void onEnable() {
    getCommand("refresh-map-data").setExecutor(new CommandRefreshMapData(this));
  }
}
