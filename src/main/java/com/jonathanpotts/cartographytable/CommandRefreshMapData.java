package com.jonathanpotts.cartographytable;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;

import org.bukkit.Bukkit;
import org.bukkit.Chunk;
import org.bukkit.ChunkSnapshot;
import org.bukkit.World;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.Plugin;

public class CommandRefreshMapData implements CommandExecutor {
    private static final int CHUNK_SIZE = 16;
    private static final int MIN_Y = 0;

    private Plugin plugin;

    public CommandRefreshMapData(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        for (World world : Bukkit.getWorlds()) {
            List<int[]> chunkLocs = new ArrayList<int[]>();

            // TODO: Check to see if files exist to prevent exception
            for (File file : new File(world.getWorldFolder(), "region").listFiles()) {
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
                Bukkit.getLogger().info("Got chunk at " + chunkLoc[0] + ", " + chunkLoc[1]);
            }
        }

        return true;
    }
}
