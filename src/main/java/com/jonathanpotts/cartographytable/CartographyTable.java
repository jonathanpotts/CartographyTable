package com.jonathanpotts.cartographytable;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.List;

public class CartographyTable extends JavaPlugin {
    @Override
    public void onEnable() {
        List<World> worlds = Bukkit.getWorlds();

        getLogger().info("First world is " + worlds.get(0).getName());
    }
}
