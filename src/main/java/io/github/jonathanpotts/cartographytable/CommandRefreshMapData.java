package io.github.jonathanpotts.cartographytable;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.bukkit.ChunkSnapshot;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.data.BlockData;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.Plugin;

import io.github.jonathanpotts.cartographytable.models.BlockModel;
import io.github.jonathanpotts.cartographytable.models.ChunkModel;
import io.github.jonathanpotts.cartographytable.models.VectorXZ;

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
    private Gson gson;

    public CommandRefreshMapData(Plugin plugin) {
        this.plugin = plugin;

        gson = new GsonBuilder()
            .disableHtmlEscaping()
            .create();
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (isRefreshing) {
            plugin.getLogger().info("Map data is already being refreshed");
            return true;
        }

        isRefreshing = true;

        try {
            generateMaterialMap();
        } catch (IOException e) {
            plugin.getLogger().severe("Unable to save material map: " + e.toString());
            return true;
        }

        for (World world : plugin.getServer().getWorlds()) {
            try {
                processWorld(world);
            }
            catch (IOException e) {
                plugin.getLogger().severe("Unable to process world (" + world.getName() + "): " + e.toString());
            }
        }

        plugin.getLogger().info("Map data has been refreshed");
        isRefreshing = false;
        return true;
    }

    private void generateMaterialMap() throws IOException {
        Map<Integer, String> materialMap = new HashMap<>();

        for (Material material : Material.values()) {
            if (!material.isBlock()) {
                continue;
            }

            materialMap.put(material.ordinal(), material.createBlockData().getAsString(true).split("\\[")[0]);
        }

        String json = gson.toJson(materialMap);

        Path path = plugin.getDataFolder().toPath()
        .resolve("materials")
        .resolve("map.json");

        if (!Files.exists(path.getParent())) {
            Files.createDirectories(path.getParent());
        }

        Files.write(path, json.getBytes());
    }

    private void processWorld(World world) throws IOException {
        Path folder = world.getWorldFolder().toPath();
        folder = folder.resolve("region");

        if (!Files.exists(folder)) {
            return;
        }

        List<VectorXZ> chunkLocs = new ArrayList<>();

        List<String> files = null;

        // Get list of generated chunks by looking at region data files.
        try {
            files = Files.list(folder)
                .filter(file -> !Files.isDirectory(file))
                .map(Path::getFileName)
                .map(Path::toString)
                .collect(Collectors.toList());
        } catch (IOException e) {
            throw new IOException("Unable to access world data", e);
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
            ChunkModel chunkModel = processChunk(world, chunkLoc.x, chunkLoc.z);

            String json = gson.toJson(chunkModel);

            Path path = plugin.getDataFolder().toPath()
                .resolve("chunks")
                .resolve(world.getName())
                .resolve(chunkLoc.x + "." + chunkLoc.z + ".json");
    
            try {
                if (!Files.exists(path.getParent())) {
                    Files.createDirectories(path.getParent());
                }
    
                Files.write(path, json.getBytes());
            } catch (IOException e) {
                throw new IOException("Unable to write chunk file", e);
            }
        }
    }

    private ChunkModel processChunk(World world, int x, int z) {
        ChunkSnapshot chunk = world.getChunkAt(x, z).getChunkSnapshot();
        ChunkModel chunkModel = new ChunkModel();
        chunkModel.blocks = new HashMap<>();

        for (short blockY = MIN_Y; blockY <= MAX_Y; blockY++) {
            for (byte blockX = MIN_X; blockX <= MAX_X; blockX++) {
                for (byte blockZ = MIN_Z; blockZ <= MAX_Z; blockZ++) {
                    BlockModel blockModel = processBlock(chunk, blockX, blockY, blockZ);

                    if (blockModel == null) {
                        continue;
                    }

                    if (chunkModel.blocks.get(blockY) == null) {
                        chunkModel.blocks.put(blockY, new HashMap<>());
                    }

                    if (chunkModel.blocks.get(blockY).get(blockX) == null) {
                        chunkModel.blocks.get(blockY).put(blockX, new HashMap<>());
                    }

                    chunkModel.blocks.get(blockY).get(blockX).put(blockZ, blockModel);
                }
            }
        }

        return chunkModel;
    }

    private BlockModel processBlock(ChunkSnapshot chunk, byte x, short y, byte z) {
        BlockData block = chunk.getBlockData(x, y, z);

        if (block.getMaterial().isAir()) {
            boolean surroundedByAir = 
                (y > MIN_Y ? chunk.getBlockData(x, y - 1, z).getMaterial().isAir() : true)
                && (y < MAX_Y ? chunk.getBlockData(x, y + 1, z).getMaterial().isAir() : true)
                // Keep edge blocks on X and Z axes in case of needing light information in a different chunk.
                && (x > MIN_X ? chunk.getBlockData(x - 1, y, z).getMaterial().isAir() : false)
                && (x < MAX_X ? chunk.getBlockData(x + 1, y, z).getMaterial().isAir() : false)
                && (z > MIN_Z ? chunk.getBlockData(x, y, z - 1).getMaterial().isAir() : false)
                && (z < MAX_Z ? chunk.getBlockData(x, y, z + 1).getMaterial().isAir() : false);

            if (surroundedByAir) {
                return null;
            }
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

        if (emittedLight != (block.getMaterial().isAir() ? MAX_LIGHT_LEVEL : MIN_LIGHT_LEVEL)) {
            if (blockModel.light == null) {
                blockModel.light = new HashMap<>();
            }

            blockModel.light.put(LightType.EMITTED.ordinal(), emittedLight);
        }

        if (skyLight != (block.getMaterial().isAir() ? MAX_LIGHT_LEVEL : MIN_LIGHT_LEVEL)) {
            if (blockModel.light == null) {
                blockModel.light = new HashMap<>();
            }

            blockModel.light.put(LightType.SKY.ordinal(), skyLight);
        }

        return blockModel;
    }
}
