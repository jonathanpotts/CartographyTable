package com.jonathanpotts.cartographytable;

import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;

import org.bukkit.Bukkit;
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
            int radius = (int)Math.ceil(world.getWorldBorder().getSize() / 2) / CHUNK_SIZE;
            int centerX = world.getWorldBorder().getCenter().getBlockX() / CHUNK_SIZE;
            int centerZ = world.getWorldBorder().getCenter().getBlockZ() / CHUNK_SIZE;

            int minX = centerX - radius;
            int maxX = centerX + radius;
            int minZ = centerZ - radius;
            int maxZ = centerZ + radius;

            Gson gson = new Gson();

            for (int cx = minX; cx <= maxX; cx++) {
                for (int cz = minZ; cz <= maxZ; cz++) {
                    if (!world.isChunkGenerated(cx, cz)) {
                        continue;
                    }

                    ChunkSnapshot chunk = world.getChunkAt(cx, cz).getChunkSnapshot();

                    int chunkX = cx;
                    int chunkZ = cz;

                    Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
                        Map<String, String> data = new HashMap<String, String>();

                        for (int x = 0; x < CHUNK_SIZE; x++) {
                            for (int y = MIN_Y; y < world.getMaxHeight(); y++) {
                                for (int z = 0; z < CHUNK_SIZE; z++) {
                                    data.put(x + "." + y + "." + z, chunk.getBlockData(x, y, z).getAsString());
                                }
                            }
                        }
    
                        try {
                            FileWriter fileWriter = new FileWriter(chunkX + "." + chunkZ + ".json");
                            fileWriter.write(gson.toJson(data));
                            fileWriter.close();
                        }
                        catch (IOException e) {
                        }
                    });

                    return true;
                }
            }
        }

        return true;
    }
}
