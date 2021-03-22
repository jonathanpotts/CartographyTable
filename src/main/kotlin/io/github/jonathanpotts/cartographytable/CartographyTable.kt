package io.github.jonathanpotts.cartographytable;

import org.bukkit.plugin.java.JavaPlugin;

public class CartographyTable : JavaPlugin() {
    override public fun onEnable() {
        getCommand("refresh-map-data")?.setExecutor(CommandRefreshMapData(this));
    }
}
