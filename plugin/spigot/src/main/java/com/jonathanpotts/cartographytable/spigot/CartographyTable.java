package com.jonathanpotts.cartographytable.spigot;

import org.bukkit.plugin.java.JavaPlugin;

/**
 * The CartographyTable server plugin.
 */
@SuppressWarnings("unused")
public class CartographyTable extends JavaPlugin {
    @Override
    public void onEnable() {
        //noinspection ConstantConditions
        getCommand("refresh-map-data").setExecutor(new CommandRefreshMapData(this));
    }
}
