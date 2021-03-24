package com.jonathanpotts.cartographytable.spigot

import org.bukkit.plugin.java.JavaPlugin

/**
 * The CartographyTable server plugin.
 */
@Suppress("unused")
class CartographyTable : JavaPlugin() {
    override fun onEnable() {
        getCommand("refresh-map-data")?.setExecutor(CommandRefreshMapData(this))
    }
}
