package com.jonathanpotts.blockmaps.spigot;

import org.bukkit.plugin.java.JavaPlugin;

/**
 * The BlockMaps server plugin.
 */
public class BlockMaps extends JavaPlugin {
  @Override
  public void onEnable() {
    getCommand("refresh-map-data").setExecutor(new CommandRefreshMapData(this));
  }
}
