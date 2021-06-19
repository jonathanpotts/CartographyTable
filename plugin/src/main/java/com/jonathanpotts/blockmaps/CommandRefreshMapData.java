package com.jonathanpotts.blockmaps;

import com.google.gson.*;
import com.google.gson.stream.JsonReader;
import com.jonathanpotts.blockmaps.models.*;
import org.bukkit.Chunk;
import org.bukkit.ChunkSnapshot;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Biome;
import org.bukkit.block.data.BlockData;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;

import net.sf.image4j.codec.ico.ICOEncoder;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.zip.GZIPOutputStream;

import javax.imageio.ImageIO;

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
   * Folder containing data for the plugin.
   */
  private final Path pluginDataPath;

  /**
   * Folder containing data for the web app.
   */

  private final Path webDataPath;

  /**
   * Status of the command execution.
   */
  private boolean isExecuting = false;

  /**
   * Collection of materials that are tinted.
   */
  Set<Material> tintedMaterials;

  /**
   * Creates an instance of the command executor.
   *
   * @param plugin The server plugin associated to this command.
   */
  public CommandRefreshMapData(JavaPlugin plugin) {
    this.plugin = plugin;
    gson = new GsonBuilder().disableHtmlEscaping().create();

    pluginDataPath = plugin.getDataFolder().toPath();
    Path webPath = pluginDataPath.resolve("web");
    webDataPath = webPath.resolve("data");

    tintedMaterials = new HashSet<Material>();
    tintedMaterials.add(Material.GRASS_BLOCK);
    tintedMaterials.add(Material.GRASS);
    tintedMaterials.add(Material.TALL_GRASS);
    tintedMaterials.add(Material.FERN);
    tintedMaterials.add(Material.LARGE_FERN);
    tintedMaterials.add(Material.POTTED_FERN);
    tintedMaterials.add(Material.SUGAR_CANE);
    tintedMaterials.add(Material.OAK_LEAVES);
    tintedMaterials.add(Material.DARK_OAK_LEAVES);
    tintedMaterials.add(Material.JUNGLE_LEAVES);
    tintedMaterials.add(Material.ACACIA_LEAVES);
    tintedMaterials.add(Material.VINE);
    tintedMaterials.add(Material.WATER);
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
        copyWebApp();
        generateServerData();
        generateMaterialData();
        generateBiomeData();
        downloadMaterialTexturesAndModels();
        processWorlds();

        plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
          plugin.getLogger().info("The map has been refreshed");

          return null;
        });
      } catch (URISyntaxException | IOException | InterruptedException | ExecutionException e) {
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
   * Copies the web app into the plugin data folder.
   * 
   * @throws URISyntaxException Thrown if there is an issue with the executable
   *                            path.
   * @throws IOException        Thrown if there is an issue copying the files.
   */
  private void copyWebApp() throws URISyntaxException, IOException {
    Files.createDirectories(pluginDataPath);

    URI jarFilePath = getClass().getProtectionDomain().getCodeSource().getLocation().toURI();
    Path jarFile = Paths.get(jarFilePath);

    try (FileSystem fs = FileSystems.newFileSystem(jarFile, (ClassLoader)null)) {
      Path dataPath = fs.getRootDirectories().iterator().next().resolve("data");

      if (!Files.exists(dataPath)) {
        return;
      }

      for (Path source : Files.walk(dataPath).collect(Collectors.toSet())) {
        Path relativePath = dataPath.relativize(source);
        Path destination = pluginDataPath.resolve(relativePath.toString());
        if (Files.isDirectory(destination)) {
          continue;
        }

        Files.createDirectories(destination.getParent());
        Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
      }
    }
  }

  /**
   * Generates server data and saves it.
   *
   * @throws IOException Thrown if there an issue when saving the data.
   */
  private void generateServerData() throws InterruptedException, ExecutionException, IOException {
    ServerModel serverModel = plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
      ServerModel model = new ServerModel();
      model.motd = plugin.getServer().getMotd();

      for (World world : plugin.getServer().getWorlds()) {
        WorldModel worldModel = new WorldModel();
        worldModel.name = world.getName();
        worldModel.spawn = new VectorXYZ(world.getSpawnLocation().getBlockX(), world.getSpawnLocation().getBlockY(),
            world.getSpawnLocation().getBlockZ());

        worldModel.minHeight = world.getMinHeight();
        worldModel.maxHeight = world.getMaxHeight();

        if (model.worlds == null) {
          model.worlds = new ArrayList<>();
        }

        model.worlds.add(worldModel);
      }

      return model;
    }).get();

    Files.createDirectories(webDataPath);

    Path licensePath = webDataPath.resolve("LICENSE.txt");
    Files.write(licensePath, Constants.MINECRAFT_LICENSE_NOTICE.getBytes(StandardCharsets.UTF_8));

    String serverJson = gson.toJson(serverModel);
    Path serverPath = webDataPath.resolve("server.json");
    Files.write(serverPath, serverJson.getBytes(StandardCharsets.UTF_8));
  }

  /**
   * Generates material data and saves it.
   *
   * @throws IOException Thrown if there an issue when saving the data.
   */
  private void generateMaterialData() throws InterruptedException, ExecutionException, IOException {
    Map<Integer, String> materials = plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
      Map<Integer, String> map = new HashMap<>();

      for (Material material : Material.values()) {
        if (!material.isBlock()) {
          continue;
        }

        map.put(material.ordinal(), material.createBlockData().getAsString().split("\\[")[0]);
      }

      return map;
    }).get();

    Files.createDirectories(webDataPath);

    String materialsJson = gson.toJson(materials);
    Path materialsPath = webDataPath.resolve("materials.json");
    Files.write(materialsPath, materialsJson.getBytes(StandardCharsets.UTF_8));
  }

  /**
   * Generates biome data and saves it.
   *
   * @throws IOException Thrown if there an issue when saving the data.
   */
  private void generateBiomeData() throws InterruptedException, ExecutionException, IOException {
    Map<Integer, String> biomes = plugin.getServer().getScheduler().callSyncMethod(plugin, () -> {
      Map<Integer, String> map = new HashMap<>();

      for (Biome biome : Biome.values()) {
        map.put(biome.ordinal(), biome.toString());
      }

      return map;
    }).get();

    Files.createDirectories(webDataPath);

    String biomesJson = gson.toJson(biomes);
    Path biomesPath = webDataPath.resolve("biomes.json");
    Files.write(biomesPath, biomesJson.getBytes(StandardCharsets.UTF_8));
  }

  /**
   * Downloads material textures and models.
   *
   * @throws IOException Thrown if there an issue while downloading textures and
   *                     models.
   */
  private void downloadMaterialTexturesAndModels() throws IOException {
    JsonObject jsonObject;

    try (JsonReader jsonReader = new JsonReader(
        new InputStreamReader(new URL(Constants.LAUNCHER_VERSION_MANIFEST).openStream()))) {
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

    try (JsonReader jsonReader = new JsonReader(new InputStreamReader(new URL(latestReleaseManifest).openStream()))) {
      jsonObject = new JsonParser().parse(jsonReader).getAsJsonObject();
    }

    String client = jsonObject.get("downloads").getAsJsonObject().get("client").getAsJsonObject().get("url")
        .getAsString();

    Path clientTempFile = Files.createTempFile("BlockMaps", ".jar");

    try (InputStream clientStream = new URL(client).openStream()) {
      Files.copy(clientStream, clientTempFile, StandardCopyOption.REPLACE_EXISTING);
    }

    Path iconDestination = pluginDataPath.resolve("web").resolve("apple-touch-icon.png");

    try (FileSystem fs = FileSystems.newFileSystem(clientTempFile, (ClassLoader)null)) {
      Path texturesPath = webDataPath.resolve("textures").resolve("block");

      Files.createDirectories(texturesPath);

      Path zipTexturesPath = fs.getRootDirectories().iterator().next().resolve("assets").resolve("minecraft")
          .resolve("textures").resolve("block");

      for (Path source : Files.walk(zipTexturesPath).collect(Collectors.toSet())) {
        Path relativePath = zipTexturesPath.relativize(source);
        Path destination = texturesPath.resolve(relativePath.toString());
        if (Files.isDirectory(destination)) {
          continue;
        }

        Files.createDirectories(destination.getParent());
        Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
      }

      Path colorMapsPath = webDataPath.resolve("textures").resolve("colormap");

      Files.createDirectories(colorMapsPath);

      Path zipColorMapsPath = fs.getRootDirectories().iterator().next().resolve("assets").resolve("minecraft")
          .resolve("textures").resolve("colormap");

      for (Path source : Files.walk(zipColorMapsPath).collect(Collectors.toSet())) {
        Path relativePath = zipColorMapsPath.relativize(source);
        Path destination = colorMapsPath.resolve(relativePath.toString());
        if (Files.isDirectory(destination)) {
          continue;
        }

        Files.createDirectories(destination.getParent());
        Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
      }

      Path blockStatesPath = webDataPath.resolve("blockstates");

      Files.createDirectories(blockStatesPath);

      Path zipBlockStatesPath = fs.getRootDirectories().iterator().next().resolve("assets").resolve("minecraft")
          .resolve("blockstates");

      for (Path source : Files.walk(zipBlockStatesPath).collect(Collectors.toSet())) {
        Path relativePath = zipBlockStatesPath.relativize(source);
        Path destination = blockStatesPath.resolve(relativePath.toString());
        if (Files.isDirectory(destination)) {
          continue;
        }

        Files.createDirectories(destination.getParent());
        Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
      }

      Path modelsPath = webDataPath.resolve("models").resolve("block");

      Files.createDirectories(modelsPath);

      Path zipModelsPath = fs.getRootDirectories().iterator().next().resolve("assets").resolve("minecraft")
          .resolve("models").resolve("block");

      for (Path source : Files.walk(zipModelsPath).collect(Collectors.toSet())) {
        Path relativePath = zipModelsPath.relativize(source);
        Path destination = modelsPath.resolve(relativePath.toString());
        if (Files.isDirectory(destination)) {
          continue;
        }

        Files.createDirectories(destination.getParent());
        Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
      }

      Path serverPath = plugin.getServer().getWorldContainer().toPath();
      Path serverIconPath = serverPath.resolve("server-icon.png");

      Files.createDirectories(iconDestination.getParent());

      if (Files.exists(serverIconPath)) {
        Files.copy(serverIconPath, iconDestination, StandardCopyOption.REPLACE_EXISTING);
      } else {
        Path defaultIconPath = fs.getRootDirectories().iterator().next().resolve("assets").resolve("minecraft")
            .resolve("textures").resolve("misc").resolve("unknown_server.png");
        Files.copy(defaultIconPath, iconDestination, StandardCopyOption.REPLACE_EXISTING);
      }
    }

    Files.delete(clientTempFile);

    Path favicon = pluginDataPath.resolve("web").resolve("favicon.ico");
    Files.createDirectories(favicon.getParent());

    BufferedImage serverIcon = ImageIO.read(iconDestination.toFile());
    ICOEncoder.write(serverIcon, favicon.toFile());
  }

  /**
   * Processes worlds and saves data.
   */
  private void processWorlds() throws InterruptedException, ExecutionException, IOException {
    List<World> worlds = plugin.getServer().getScheduler().callSyncMethod(plugin, () -> plugin.getServer().getWorlds())
        .get();

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
    Path worldPath = plugin.getServer().getScheduler().callSyncMethod(plugin, () -> world.getWorldFolder().toPath())
        .get();
    Path regionPath = worldPath.resolve("region");
    if (!Files.exists(regionPath)) {
      return;
    }

    Set<String> files = Files.list(regionPath).filter(p -> !Files.isDirectory(p)).map(Path::getFileName)
        .map(Path::toString).collect(Collectors.toSet());

    Set<VectorXZ> regionCoordinates = new HashSet<>();

    for (String file : files) {
      String[] splitName = file.split("\\.");

      if (!splitName[0].equals("r") || splitName.length != 4 || !splitName[3].equals("mca")) {
        continue;
      }

      int x = Integer.parseInt(splitName[1]);
      int z = Integer.parseInt(splitName[2]);

      regionCoordinates.add(new VectorXZ(x, z));
    }

    for (VectorXZ coordinates : regionCoordinates) {
      processRegion(world, coordinates);
    }
  }

  /**
   * Processes a region and saves data.
   * 
   * @param world       World containing the region.
   * @param coordinates Coordinates of the region.
   */
  private void processRegion(World world, VectorXZ coordinates)
      throws InterruptedException, ExecutionException, IOException {
    int startX = coordinates.x * Constants.WIDTH_OF_REGION;
    int startZ = coordinates.z * Constants.DEPTH_OF_REGION;

    for (int x = startX; x < startX + Constants.WIDTH_OF_REGION; x++) {
      for (int z = startZ; z < startZ + Constants.DEPTH_OF_REGION; z++) {
        processChunk(world, new VectorXZ(x, z));
      }
    }
  }

  /**
   * Processes a chunk and saves data.
   *
   * @param world       World containing the chunk.
   * @param coordinates Coordinates of the chunk.
   */
  private void processChunk(World world, VectorXZ coordinates)
      throws InterruptedException, ExecutionException, IOException {
    Map<Integer, Map<Integer, Map<Integer, BlockDataModel>>> chunkBlocks = plugin.getServer().getScheduler()
        .callSyncMethod(plugin, () -> {
          if (!world.isChunkGenerated(coordinates.x, coordinates.z)) {
            return null;
          }

          Chunk chunk = world.getChunkAt(coordinates.x, coordinates.z);
          ChunkSnapshot snapshot = chunk.getChunkSnapshot();
          Map<Integer, Map<Integer, Map<Integer, BlockDataModel>>> blocks = null;

          for (int y = world.getMinHeight(); y < world.getMaxHeight(); y++) {
            for (int x = 0; x < Constants.WIDTH_OF_CHUNK; x++) {
              for (int z = 0; z < Constants.DEPTH_OF_CHUNK; z++) {
                BlockDataModel blockModel = processBlock(world.getMinHeight(), world.getMaxHeight(), snapshot, world, x,
                    y, z);

                if (blockModel == null) {
                  continue;
                }

                if (blocks == null) {
                  blocks = new HashMap<>();
                }

                blocks.computeIfAbsent(y, k -> new HashMap<>());
                blocks.get(y).computeIfAbsent(x, k -> new HashMap<>());

                blocks.get(y).get(x).put(z, blockModel);
              }
            }
          }

          return blocks;
        }).get();

    if (chunkBlocks == null) {
      return;
    }

    String chunkJson = gson.toJson(chunkBlocks);
    Path worldPath = webDataPath.resolve("worlds").resolve(world.getName());
    Path chunkPath = worldPath.resolve(coordinates.x + "." + coordinates.z + ".json.gz");
    writeStringToGzipFile(chunkJson, chunkPath);
  }

  /**
   * Processes a block.
   *
   * @param minHeight     Minimum height of the world.
   * @param maxHeight     Maximum height of the world.
   * @param chunkSnapshot Snapshot of the chunk containing the block.
   * @param world         World containing the block.
   * @param x             X coordinate of the block in the chunk.
   * @param y             Y coordinate of the block in the chunk.
   * @param z             Z coordinate of the block in the chunk.
   * @return The processes block data.
   */
  private BlockDataModel processBlock(int minHeight, int maxHeight, ChunkSnapshot chunkSnapshot, World world, int x,
      int y, int z) {
    BlockData blockData = chunkSnapshot.getBlockData(x, y, z);

    if (blockData.getMaterial().isAir()) {
      boolean surroundedByAir = true;

      if (y > minHeight) {
        surroundedByAir = chunkSnapshot.getBlockData(x, y - 1, z).getMaterial().isAir();
      }

      if (y < maxHeight - 1) {
        surroundedByAir = surroundedByAir && chunkSnapshot.getBlockData(x, y + 1, z).getMaterial().isAir();
      }

      // Keep edge blocks on X and Z axes in case of needing light information in a
      // different chunk.

      surroundedByAir = x > 0 && surroundedByAir && chunkSnapshot.getBlockData(x - 1, y, z).getMaterial().isAir();
      surroundedByAir = x < Constants.WIDTH_OF_CHUNK - 1 && surroundedByAir
          && chunkSnapshot.getBlockData(x + 1, y, z).getMaterial().isAir();
      surroundedByAir = z > 0 && surroundedByAir && chunkSnapshot.getBlockData(x, y, z - 1).getMaterial().isAir();
      surroundedByAir = z < Constants.DEPTH_OF_CHUNK - 1 && surroundedByAir
          && chunkSnapshot.getBlockData(x, y, z + 1).getMaterial().isAir();

      if (surroundedByAir) {
        // If an air block is surrounded by air, the lighting data for that block is not
        // needed.
        return null;
      }
    }

    BlockDataModel blockModel = new BlockDataModel();
    blockModel.material = blockData.getMaterial().ordinal();

    String data = blockData.getAsString();
    int dataStartIndex = data.indexOf("[");

    if (dataStartIndex > 0) {
      int dataEndIndex = data.indexOf("]", dataStartIndex);

      if (dataEndIndex > dataStartIndex) {
        blockModel.data = data.substring(dataStartIndex + 1, dataEndIndex);
      }
    }

    int defaultLightValue = blockData.getMaterial() == Material.AIR ? Constants.MAX_LIGHT_LEVEL
        : Constants.MIN_LIGHT_LEVEL;

    int skyLight = chunkSnapshot.getBlockSkyLight(x, y, z);
    int emittedLight = chunkSnapshot.getBlockEmittedLight(x, y, z);

    if (skyLight != defaultLightValue) {
      blockModel.skyLight = skyLight;
    }

    if (emittedLight != defaultLightValue) {
      blockModel.emittedLight = emittedLight;
    }

    if (tintedMaterials.contains(blockData.getMaterial())) {
      blockModel.biome = world.getBiome(x, y, z).ordinal();
      blockModel.temperature = world.getTemperature(x, y, z);
      blockModel.humidity = world.getHumidity(x, y, z);
    }

    if (blockData.getMaterial().isAir() && blockModel.skyLight == null && blockModel.emittedLight == null) {
      return null;
    }

    return blockModel;
  }

  /**
   * Writes a string to a GZIP-compressed file.
   * 
   * @param string   String to write.
   * @param filePath Path to write to.
   * @throws IOException Thrown if there is an issue while writing the file.
   */
  private void writeStringToGzipFile(String string, Path filePath) throws IOException {
    byte[] bytes;

    try (ByteArrayOutputStream byteArrayOS = new ByteArrayOutputStream();
        GZIPOutputStream gzipOS = new GZIPOutputStream(byteArrayOS);
        OutputStreamWriter osWriter = new OutputStreamWriter(gzipOS, StandardCharsets.UTF_8);) {
      osWriter.write(string);
      osWriter.close();
      bytes = byteArrayOS.toByteArray();
    }

    Files.createDirectories(filePath.getParent());
    Files.write(filePath, bytes);
  }
}
