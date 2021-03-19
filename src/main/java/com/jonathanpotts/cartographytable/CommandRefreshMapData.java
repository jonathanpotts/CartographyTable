package com.jonathanpotts.cartographytable;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.google.gson.Gson;
import com.jonathanpotts.cartographytable.models.Block;
import com.jonathanpotts.cartographytable.models.Chunk;
import com.jonathanpotts.cartographytable.models.VectorXZ;

import org.bukkit.ChunkSnapshot;
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
            return true;
        }

        plugin.getLogger().info("Starting map data refresh");
        isRefreshing = true;

        for (World world : plugin.getServer().getWorlds()) {
            Path folder = world.getWorldFolder().toPath();

            if (!Files.exists(folder)) {
                continue;
            }

            folder = folder.resolve("region");

            if (!Files.exists(folder)) {
                continue;
            }

            List<VectorXZ> chunkLocs = new ArrayList<>();

            List<String> files = null;

            try {
                files = Files.list(folder)
                    .filter(file -> !Files.isDirectory(file))
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .collect(Collectors.toList());
            } catch (IOException e) {
                plugin.getLogger().severe("Unable to access world data: " + e.toString());
                return true;
            }

            for (String file : files) {
                String[] split = file.split("\\.");

                if (!split[0].equals("r") || split.length != 4 || !split[3].equals("mca")) {
                    continue;
                }

                int chunkX = Integer.parseInt(split[1]);
                int chunkZ = Integer.parseInt(split[2]);

                chunkLocs.add(new VectorXZ(chunkX, chunkZ));
            }

            for (VectorXZ chunkLoc : chunkLocs) {
                ChunkSnapshot snapshot = world.getChunkAt(chunkLoc.x, chunkLoc.z).getChunkSnapshot();

                Chunk chunk = new Chunk();
                chunk.blocks = new HashMap<>();

                for (int y = 0; y < 256; y++) {
                    for (int x = 0; x < 16; x++) {
                        for (int z = 0; z < 16; z++) {
                            String data = snapshot.getBlockData(x, y, z).getAsString();

                            if (data.equals("minecraft:air")) {
                                continue;
                            }

                            Map<Integer, Map<Integer, Block>> yMap = chunk.blocks.get(y);

                            if (yMap == null) {
                                yMap = new HashMap<>();
                                chunk.blocks.put(y, yMap);
                            }

                            Map<Integer, Block> xMap = yMap.get(x);

                            if (xMap == null) {
                                xMap = new HashMap<>();
                                yMap.put(x, xMap);
                            }

                            Block block = new Block();
                            block.data = data;
                            block.emittedLight = snapshot.getBlockEmittedLight(x, y, z);
                            block.skyLight = snapshot.getBlockSkyLight(x, y, z);

                            xMap.put(z, block);
                        }
                    }
                }

                Gson gson = new Gson();
                String json = gson.toJson(chunk);

                String filePath = plugin.getDataFolder() + FileSystems.getDefault().getSeparator() 
                    + "chunks" + FileSystems.getDefault().getSeparator() 
                    + world.getName() + FileSystems.getDefault().getSeparator()
                    + chunkLoc.x + "." + chunkLoc.z + ".json";

                Path path = Paths.get(filePath);

                try
                {
                    plugin.getLogger().info("Writing chunk file to " + filePath);

                    if (!Files.exists(path.getParent())) {
                        Files.createDirectories(path.getParent());
                    }

                    Files.write(path, json.getBytes());
                }
                catch (IOException e)
                {
                    plugin.getLogger().severe("Unable to write chunk file: " + e.toString());
                    return true;
                }
            }
        }

        plugin.getLogger().info("Map data has been refreshed");
        isRefreshing = false;
        return true;
    }
}
