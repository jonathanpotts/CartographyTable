package com.jonathanpotts.cartographytable;

import org.bukkit.plugin.java.JavaPlugin;

public class CartographyTable extends JavaPlugin {
    @Override
    public void onEnable() {
        getCommand("refresh-map-data").setExecutor(new CommandRefreshMapData(this));
    }
}
