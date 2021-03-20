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
import com.google.gson.GsonBuilder;
import com.jonathanpotts.cartographytable.models.BlockModel;
import com.jonathanpotts.cartographytable.models.ChunkModel;
import com.jonathanpotts.cartographytable.models.VectorXZ;

import org.bukkit.ChunkSnapshot;
import org.bukkit.World;
import org.bukkit.block.data.BlockData;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.Plugin;

public class CommandRefreshMapData implements CommandExecutor {
    private static final short MIN_Y = 0;
    private static final short MAX_Y = 255;
    private static final byte MIN_X = 0;
    private static final byte MAX_X = 15;
    private static final byte MIN_Z = 0;
    private static final byte MAX_Z = 15;
    private static final byte MIN_LIGHT_LEVEL = 0;
    private static final byte MAX_LIGHT_LEVEL = 15;

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

        Gson gson = new GsonBuilder()
            .disableHtmlEscaping()
            .create();

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
                ChunkSnapshot chunk = world.getChunkAt(chunkLoc.x, chunkLoc.z).getChunkSnapshot();

                ChunkModel chunkModel = new ChunkModel();
                chunkModel.blocks = new HashMap<>();

                for (short y = MIN_Y; y <= MAX_Y; y++) {
                    for (byte x = MIN_X; x <= MAX_X; x++) {
                        for (byte z = MIN_Z; z <= MAX_Z; z++) {
                            BlockData block = chunk.getBlockData(x, y, z);

                            boolean isAir = block.getMaterial().isAir();

                            if (isAir) {
                                boolean surroundedByAir = 
                                    (y > MIN_Y ? chunk.getBlockData(x, y - 1, z).getMaterial().isAir() : true)
                                    && (y < MAX_Y ? chunk.getBlockData(x, y + 1, z).getMaterial().isAir() : true)
                                    // Keep edge blocks on X and Z axes in case of needing light information in a different chunk.
                                    && (x > MIN_X ? chunk.getBlockData(x - 1, y, z).getMaterial().isAir() : false)
                                    && (x < MAX_X ? chunk.getBlockData(x + 1, y, z).getMaterial().isAir() : false)
                                    && (z > MIN_Z ? chunk.getBlockData(x, y, z - 1).getMaterial().isAir() : false)
                                    && (z < MAX_Z ? chunk.getBlockData(x, y, z + 1).getMaterial().isAir() : false);

                                if (surroundedByAir) {
                                    continue;
                                }
                            }

                            Map<Byte, Map<Byte, BlockModel>> yMap = chunkModel.blocks.get(y);

                            if (yMap == null) {
                                yMap = new HashMap<>();
                                chunkModel.blocks.put(y, yMap);
                            }

                            Map<Byte, BlockModel> xMap = yMap.get(x);

                            if (xMap == null) {
                                xMap = new HashMap<>();
                                yMap.put(x, xMap);
                            }

                            byte emittedLight = (byte)chunk.getBlockEmittedLight(x, y, z);
                            byte skyLight = (byte)chunk.getBlockSkyLight(x, y, z);

                            BlockModel blockModel = new BlockModel();
                            blockModel.mat = block.getMaterial().ordinal();

                            String blockData = block.getAsString(true);
                            int dataStartIndex = blockData.indexOf("[");

                            if (dataStartIndex > 0) {
                                int dataEndIndex = blockData.indexOf("]", dataStartIndex);

                                if (dataEndIndex > dataStartIndex) {
                                    blockModel.data = blockData.substring(dataStartIndex + 1, dataEndIndex);
                                }
                            }

                            if (isAir) {
                                if (emittedLight != MAX_LIGHT_LEVEL) {
                                    if (blockModel.light == null) {
                                        blockModel.light = new HashMap<>();
                                    }

                                    blockModel.light.put(LightType.EMITTED.ordinal(), emittedLight);
                                }

                                if (skyLight != MAX_LIGHT_LEVEL) {
                                    if (blockModel.light == null) {
                                        blockModel.light = new HashMap<>();
                                    }

                                    blockModel.light.put(LightType.SKY.ordinal(), skyLight);
                                }
                            } else {
                                if (emittedLight != MIN_LIGHT_LEVEL) {
                                    if (blockModel.light == null) {
                                        blockModel.light = new HashMap<>();
                                    }

                                    blockModel.light.put(LightType.EMITTED.ordinal(), emittedLight);
                                }

                                if (skyLight != MIN_LIGHT_LEVEL) {
                                    if (blockModel.light == null) {
                                        blockModel.light = new HashMap<>();
                                    }

                                    blockModel.light.put(LightType.SKY.ordinal(), skyLight);
                                }
                            }

                            xMap.put(z, blockModel);
                        }
                    }
                }

                String json = gson.toJson(chunkModel);

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
