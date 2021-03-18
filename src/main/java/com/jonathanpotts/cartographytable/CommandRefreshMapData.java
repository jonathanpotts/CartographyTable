package com.jonathanpotts.cartographytable;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.Plugin;

public class CommandRefreshMapData implements CommandExecutor {
    private Plugin plugin;
    private boolean isRefreshing = false;

    public CommandRefreshMapData(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (isRefreshing) {
            plugin.getLogger().info("Map data is already being refreshed");
            return false;
        }

        plugin.getLogger().info("Starting map data refresh");
        isRefreshing = true;

        for (World world : Bukkit.getWorlds()) {
            File folder = world.getWorldFolder();

            if (!folder.exists()) {
                continue;
            }

            folder = new File(folder, "region");

            if (!folder.exists()) {
                continue;
            }

            List<int[]> chunkLocs = new ArrayList<int[]>();

            for (File file : folder.listFiles()) {
                String[] split = file.getName().split("\\.");

                if (!split[0].equals("r") || split.length != 4 || !split[3].equals("mca")) {
                    continue;
                }

                int chunkX = Integer.parseInt(split[1]);
                int chunkZ = Integer.parseInt(split[2]);

                chunkLocs.add(new int[] { chunkX, chunkZ });
            }

            for (int[] chunkLoc : chunkLocs) {
                world.getChunkAt(chunkLoc[0], chunkLoc[1]).getChunkSnapshot();
                plugin.getLogger().info("Got chunk at " + chunkLoc[0] + ", " + chunkLoc[1]);
            }
        }

        plugin.getLogger().info("Map data has been refreshed");
        isRefreshing = false;
        return true;
    }
}
