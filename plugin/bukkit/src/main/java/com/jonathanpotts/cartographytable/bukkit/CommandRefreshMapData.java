package com.jonathanpotts.cartographytable.bukkit;

import com.google.gson.*;
import com.google.gson.stream.JsonReader;
import com.jonathanpotts.cartographytable.shared.Constants;
import com.jonathanpotts.cartographytable.shared.LightType;
import com.jonathanpotts.cartographytable.shared.models.*;
import org.bukkit.Chunk;
import org.bukkit.ChunkSnapshot;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.data.BlockData;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Executes the "refresh-map-data" command.
 */
public class CommandRefreshMapData implements CommandExecutor {
    /**
     * The server plugin associated to this command.
     */
    private final JavaPlugin plugin;

    /**
     * The gson object used to process JSON.
     */
    private final Gson gson;
    /**
     * Folder containing data for the web app.
     */
    private final Path webDataPath;
    /**
     * Status of the command execution.
     */
    private boolean isExecuting = false;

    /**
     * Creates an instance of the command executor.
     *
     * @param plugin The server plugin associated to this command.
     */
    public CommandRefreshMapData(JavaPlugin plugin) {
        this.plugin = plugin;
        this.gson = new GsonBuilder()
                .disableHtmlEscaping()
                .create();

        Path webPath = plugin.getDataFolder().toPath().resolve("web");
        this.webDataPath = webPath.resolve("data");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (isExecuting) {
            plugin.getLogger().info("Map data is already being refreshed");
            return true;
        }

        isExecuting = true;

        plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                generateServerData();
                generateMaterialData();
                downloadMaterialTexturesAndModels();
                processWorlds();

                plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
                    plugin.getLogger().info("The map has been refreshed");

                    return null;
                });
            } catch (IOException | InterruptedException | ExecutionException e) {
                plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
                    plugin.getLogger().severe("Unable to save map data");
                    e.printStackTrace();

                    return null;
                });
            }

            isExecuting = false;
        });

        return true;
    }

    /**
     * Generates server data and saves it.
     *
     * @throws IOException Thrown if there an issue when saving the data.
     */
    private void generateServerData() throws IOException {
        ServerModel serverModel = new ServerModel();

        plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
            serverModel.motd = plugin.getServer().getMotd();

            for (World world : plugin.getServer().getWorlds()) {
                WorldModel worldModel = new WorldModel();
                worldModel.name = world.getName();
                worldModel.spawn = new VectorXYZ(
                        world.getSpawnLocation().getBlockX(),
                        world.getSpawnLocation().getBlockY(),
                        world.getSpawnLocation().getBlockZ()
                );

                if (serverModel.worlds == null) {
                    serverModel.worlds = new ArrayList<>();
                }

                serverModel.worlds.add(worldModel);
            }

            return null;
        });

        String serverJson = gson.toJson(serverModel);

        Files.createDirectories(webDataPath);
        Path licensePath = webDataPath.resolve("LICENSE.txt");
        Files.write(licensePath, Constants.MINECRAFT_LICENSE_NOTICE.getBytes());

        Path serverPath = webDataPath.resolve("server.json");
        Files.write(serverPath, serverJson.getBytes());
    }

    /**
     * Generates material data and saves it.
     *
     * @throws IOException Thrown if there an issue when saving the data.
     */
    private void generateMaterialData() throws IOException {
        Map<Integer, String> materials = new HashMap<>();
        plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
            for (Material material : Material.values()) {
                if (!material.isBlock()) {
                    continue;
                }

                materials.put(material.ordinal(), material.createBlockData().getAsString().split("\\[")[0]);
            }

            return null;
        });

        String materialsJson = gson.toJson(materials);

        Files.createDirectories(webDataPath);
        Path materialsPath = webDataPath.resolve("materials.json");
        Files.write(materialsPath, materialsJson.getBytes());
    }

    /**
     * Downloads material textures and models.
     *
     * @throws IOException Thrown if there an issue while downloading textures and models.
     */
    private void downloadMaterialTexturesAndModels() throws IOException {
        JsonObject jsonObject;

        try (JsonReader jsonReader = new JsonReader(
                new InputStreamReader(new URL(Constants.LAUNCHER_VERSION_MANIFEST).openStream())
        )) {
            jsonObject = new JsonParser().parse(jsonReader).getAsJsonObject();
        }

        String latestReleaseManifest = null;

        String latestRelease = jsonObject.get("latest").getAsJsonObject().get("release").getAsString();
        for (JsonElement version : jsonObject.get("versions").getAsJsonArray()) {
            if (!version.getAsJsonObject().get("id").getAsString().equals(latestRelease)) {
                continue;
            }

            latestReleaseManifest = version.getAsJsonObject().get("url").getAsString();
            break;
        }

        if (latestReleaseManifest == null) {
            throw new JsonParseException("Unable to find latest release in Minecraft version manifest");
        }

        try (JsonReader jsonReader = new JsonReader(
                new InputStreamReader(new URL(latestReleaseManifest).openStream())
        )) {
            jsonObject = new JsonParser().parse(jsonReader).getAsJsonObject();
        }

        String client = jsonObject.get("downloads").getAsJsonObject()
                .get("client").getAsJsonObject()
                .get("url").getAsString();

        Path clientTempFile = Files.createTempFile("CartographyTable", ".zip");

        try (InputStream clientStream = new URL(client).openStream()) {
            Files.copy(clientStream, clientTempFile, StandardCopyOption.REPLACE_EXISTING);
        }

        try (FileSystem fs = FileSystems.newFileSystem(clientTempFile, null)) {
            Path texturesPath = webDataPath
                    .resolve("textures")
                    .resolve("block");

            Files.createDirectories(texturesPath);

            Path zipTexturesPath = fs.getRootDirectories().iterator().next()
                    .resolve("assets")
                    .resolve("minecraft")
                    .resolve("textures")
                    .resolve("block");

            for (Path source : Files.walk(zipTexturesPath).collect(Collectors.toSet())) {
                Path relativePath = zipTexturesPath.relativize(source);
                Path destination = texturesPath.resolve(relativePath.toString());
                if (Files.isDirectory(destination)) {
                    Files.createDirectories(destination);
                    continue;
                }

                Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            Path modelsPath = webDataPath
                    .resolve("models")
                    .resolve("block");

            Files.createDirectories(modelsPath);

            Path zipModelsPath = fs.getRootDirectories().iterator().next()
                    .resolve("assets")
                    .resolve("minecraft")
                    .resolve("models")
                    .resolve("block");

            for (Path source : Files.walk(zipModelsPath).collect(Collectors.toSet())) {
                Path relativePath = zipModelsPath.relativize(source);
                Path destination = modelsPath.resolve(relativePath.toString());
                if (Files.isDirectory(destination)) {
                    Files.createDirectories(destination);
                    continue;
                }

                Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
            }
        }

        Files.delete(clientTempFile);
    }

    /**
     * Processes worlds and saves data.
     */
    private void processWorlds() throws InterruptedException, ExecutionException, IOException {
        List<World> worlds = plugin.getServer().getScheduler()
                .callSyncMethod(plugin, () -> plugin.getServer().getWorlds()).get();

        for (World world : worlds) {
            processWorld(world);
        }
    }

    /**
     * Processes a world and saves data.
     *
     * @param world The world to process.
     */
    private void processWorld(World world) throws InterruptedException, ExecutionException, IOException {
        Path worldPath = plugin.getServer().getScheduler()
                .callSyncMethod(plugin, () -> world.getWorldFolder().toPath()).get();
        Path regionPath = worldPath.resolve("region");
        if (!Files.exists(regionPath)) {
            return;
        }

        Set<String> files = Files.list(regionPath)
                .filter(p -> !Files.isDirectory(p))
                .map(Path::getFileName)
                .map(Path::toString)
                .collect(Collectors.toSet());

        Set<VectorXZ> chunkCoordinates = new HashSet<>();

        for (String file : files) {
            String[] splitName = file.split("\\.");

            if (!splitName[0].equals("r") || splitName.length != 4 || !splitName[3].equals("mca")) {
                continue;
            }

            int x = Integer.parseInt(splitName[1]);
            int z = Integer.parseInt(splitName[2]);

            chunkCoordinates.add(new VectorXZ(x, z));
        }

        for (VectorXZ coordinates : chunkCoordinates) {
            Chunk chunk = plugin.getServer().getScheduler()
                    .callSyncMethod(plugin, () -> world.getChunkAt(coordinates.x, coordinates.z)).get();

            processChunk(chunk);
        }
    }

    /**
     * Processes a chunk and saves data.
     *
     * @param chunk Chunk to process.
     */
    private void processChunk(Chunk chunk) throws InterruptedException, ExecutionException, IOException {
        ChunkModel chunkModel = plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
            ChunkSnapshot snapshot = chunk.getChunkSnapshot();
            ChunkModel model = new ChunkModel();

            for (int y = Constants.MIN_BLOCK_Y; y < chunk.getWorld().getMaxHeight(); y++) {
                for (int x = Constants.MIN_X_FOR_BLOCK_IN_CHUNK; x <= Constants.MAX_X_FOR_BLOCK_IN_CHUNK; x++) {
                    for (int z = Constants.MIN_Z_FOR_BLOCK_IN_CHUNK; z <= Constants.MAX_Z_FOR_BLOCK_IN_CHUNK; z++) {
                        BlockModel blockModel = processBlock(chunk.getWorld().getMaxHeight(), snapshot, x, y, z);

                        if (blockModel == null) {
                            continue;
                        }

                        if (model.blocks == null) {
                            model.blocks = new HashMap<>();
                        }

                        model.blocks.computeIfAbsent(y, k -> new HashMap<>());
                        model.blocks.get(y).computeIfAbsent(x, k -> new HashMap<>());

                        model.blocks.get(y).get(x).put(z, blockModel);
                    }
                }
            }

            return model;
        }).get();

        String chunkJson = gson.toJson(chunkModel);
        Path worldPath = webDataPath.resolve(chunk.getWorld().getName());
        Files.createDirectories(worldPath);
        Path chunkPath = worldPath.resolve(chunk.getX() + "." + chunk.getZ() + ".json");
        Files.write(chunkPath, chunkJson.getBytes());
    }

    /**
     * Processes a block.
     *
     * @param maxHeight     Maximum height of the world.
     * @param chunkSnapshot Snapshot of the chunk containing the block.
     * @param x             X coordinate of the block in the chunk.
     * @param y             Y coordinate of the block in the chunk.
     * @param z             Z coordinate of the block in the chunk.
     * @return The processes block data.
     */
    private BlockModel processBlock(int maxHeight, ChunkSnapshot chunkSnapshot, int x, int y, int z) {
        BlockData blockData = chunkSnapshot.getBlockData(x, y, z);

        if (blockData.getMaterial().isAir()) {
            boolean surroundedByAir = true;

            if (y > Constants.MIN_BLOCK_Y) {
                surroundedByAir = chunkSnapshot.getBlockData(x, y - 1, z).getMaterial().isAir();
            }

            if (y < maxHeight - 1) {
                surroundedByAir = surroundedByAir && chunkSnapshot.getBlockData(x, y + 1, z).getMaterial().isAir();
            }

            // Keep edge blocks on X and Z axes in case of needing light information in a different chunk.

            surroundedByAir = x > Constants.MIN_X_FOR_BLOCK_IN_CHUNK
                    && surroundedByAir && chunkSnapshot.getBlockData(x - 1, y, z).getMaterial().isAir();
            surroundedByAir = x < Constants.MAX_X_FOR_BLOCK_IN_CHUNK
                    && surroundedByAir && chunkSnapshot.getBlockData(x + 1, y, z).getMaterial().isAir();
            surroundedByAir = z > Constants.MIN_Z_FOR_BLOCK_IN_CHUNK
                    && surroundedByAir && chunkSnapshot.getBlockData(x, y, z - 1).getMaterial().isAir();
            surroundedByAir = z < Constants.MAX_Z_FOR_BLOCK_IN_CHUNK
                    && surroundedByAir && chunkSnapshot.getBlockData(x, y, z + 1).getMaterial().isAir();

            if (surroundedByAir) {
                // If an air block is surrounded by air, the lighting data for that block is not needed.
                return null;
            }
        }

        BlockModel blockModel = new BlockModel();
        blockModel.mat = blockData.getMaterial().ordinal();

        String data = blockData.getAsString(true);
        int dataStartIndex = data.indexOf("[");

        if (dataStartIndex > 0) {
            int dataEndIndex = data.indexOf("]", dataStartIndex);

            if (dataEndIndex > dataStartIndex) {
                blockModel.data = data.substring(dataStartIndex + 1, dataEndIndex);
            }
        }

        int defaultLightValue = blockData.getMaterial() == Material.AIR
                ? Constants.MAX_LIGHT_LEVEL
                : Constants.MIN_LIGHT_LEVEL;

        int skyLight = chunkSnapshot.getBlockSkyLight(x, y, z);
        int emittedLight = chunkSnapshot.getBlockEmittedLight(x, y, z);

        if (skyLight != defaultLightValue) {
            if (blockModel.light == null) {
                blockModel.light = new HashMap<>();
            }

            blockModel.light.put(LightType.SKY.ordinal(), skyLight);
        }

        if (emittedLight != defaultLightValue) {
            if (blockModel.light == null) {
                blockModel.light = new HashMap<>();
            }

            blockModel.light.put(LightType.EMITTED.ordinal(), emittedLight);
        }

        return blockModel;
    }
}
