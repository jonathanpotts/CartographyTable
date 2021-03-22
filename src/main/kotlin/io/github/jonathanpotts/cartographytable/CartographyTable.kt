package io.github.jonathanpotts.cartographytable

import org.bukkit.plugin.java.JavaPlugin

class CartographyTable : JavaPlugin() {
  override fun onEnable() {
    getCommand("refresh-map-data")?.
      setExecutor(CommandRefreshMapData(this))
  }
}
