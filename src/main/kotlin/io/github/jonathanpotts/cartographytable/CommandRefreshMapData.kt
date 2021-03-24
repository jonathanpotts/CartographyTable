package io.github.jonathanpotts.cartographytable

import io.github.jonathanpotts.cartographytable.models.*
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import kotlinx.coroutines.*
import kotlinx.serialization.*
import kotlinx.serialization.json.*
import org.bukkit.Chunk
import org.bukkit.ChunkSnapshot
import org.bukkit.Material
import org.bukkit.World
import org.bukkit.command.Command
import org.bukkit.command.CommandExecutor
import org.bukkit.command.CommandSender
import org.bukkit.plugin.java.JavaPlugin
import java.io.File
import java.io.IOException
import java.nio.file.FileSystems
import java.nio.file.Files
import java.nio.file.StandardCopyOption

/**
 * Executes the "refresh-map-data" command.
 *
 * @property plugin The server plugin associated to this command.
 * @constructor Creates an instance of the command executor.
 */
class CommandRefreshMapData(private val plugin: JavaPlugin) : CommandExecutor {
    /**
     * Status of the command execution.
     */
    private var isExecuting = false

    /**
     * Folder containing the web app.
     */
    private val webFolder = plugin.dataFolder.resolve("web")

    /**
     * Folder containing data for the web app.
     */
    private val webDataFolder = webFolder.resolve("data")

    override fun onCommand(
        sender: CommandSender,
        cmd: Command,
        label: String,
        args: Array<String>
    ): Boolean {
        if (isExecuting) {
            plugin.logger.info("Map data is already being refreshed")
            return true
        }

        isExecuting = true

        GlobalScope.launch {
            generateServerData()
            generateMaterialData()
            downloadMaterialTexturesAndModels()
            processWorlds()

            isExecuting = false
            SpigotHelpers.runOnServerThread(plugin) {
                plugin.logger.info("Map data has been refreshed")
            }
        }

        return true
    }

    /**
     * Generates server data and saves it.
     */
    private suspend fun generateServerData() {
        val serverModel = ServerModel()

        SpigotHelpers.runOnServerThread(plugin) {
            serverModel.motd = plugin.server.motd

            for (world in plugin.server.worlds) {
                val worldModel = WorldModel()
                worldModel.name = world.name
                worldModel.spawn = VectorXYZ(
                    world.spawnLocation.blockX,
                    world.spawnLocation.blockY,
                    world.spawnLocation.blockZ
                )

                serverModel.worlds.add(worldModel)
            }
        }

        val serverJson = Json.encodeToString(serverModel)

        @Suppress("BlockingMethodInNonBlockingContext")
        withContext(Dispatchers.IO) {
            webDataFolder.mkdirs()
            val licenseFile = webDataFolder.resolve("LICENSE.txt")
            licenseFile.createNewFile()
            licenseFile.writeText(Constants.MINECRAFT_LICENSE_NOTICE)

            val serverFile = webDataFolder.resolve("server.json")
            serverFile.createNewFile()
            serverFile.writeText(serverJson)
        }
    }

    /**
     * Generates material data and saves it.
     */
    private suspend fun generateMaterialData() {
        val materials = SpigotHelpers.runOnServerThread(plugin) {
            Material.values().filter { it.isBlock }
                .associate {
                    Pair(
                        it.ordinal,
                        it.createBlockData()
                            .asString
                            .split("[")
                            .first()
                    )
                }
        }

        val materialsJson = Json.encodeToString(materials)

        @Suppress("BlockingMethodInNonBlockingContext")
        withContext(Dispatchers.IO) {
            webDataFolder.mkdirs()
            val materialsFile = webDataFolder.resolve("materials.json")
            materialsFile.createNewFile()
            materialsFile.writeText(materialsJson)
        }
    }

    /**
     * Downloads material textures and models.
     */
    private suspend fun downloadMaterialTexturesAndModels() {
        val client = HttpClient(CIO)

        val launcherResponse: HttpResponse = client.get(Constants.LAUNCHER_VERSION_MANIFEST)
        val launcherResponseObject = Json.parseToJsonElement(launcherResponse.readText()).jsonObject
        val latestRelease = launcherResponseObject["latest"]?.jsonObject?.get("release")?.jsonPrimitive?.contentOrNull
            ?: throw IOException("Unable to get version for latest release from Minecraft version manifest")
        val latestReleaseManifest = launcherResponseObject["versions"]?.jsonArray?.first {
            it.jsonObject["id"]?.jsonPrimitive?.contentOrNull.equals(latestRelease)
        }?.jsonObject?.get("url")?.jsonPrimitive?.contentOrNull
            ?: throw IOException("Unable to get URL for latest release manifest from Minecraft version manifest")

        val releaseResponse: HttpResponse = client.get(latestReleaseManifest)
        val releaseResponseObject = Json.parseToJsonElement(releaseResponse.readText()).jsonObject
        val mcClient =
            releaseResponseObject["downloads"]?.jsonObject?.get("client")?.jsonObject?.get("url")?.jsonPrimitive?.contentOrNull
                ?: throw IOException("Unable to get URL for client from latest release manifest")

        val clientResponse: HttpResponse = client.get(mcClient)

        @Suppress("BlockingMethodInNonBlockingContext")
        withContext(Dispatchers.IO) {
            val clientFile = File.createTempFile("CartographyTable", ".zip")
            clientFile.writeBytes(clientResponse.readBytes())

            val fs = FileSystems.newFileSystem(clientFile.toPath(), null)

            val blockTexturesFolder = webDataFolder
                .resolve("textures")
                .resolve("block")
            blockTexturesFolder.mkdirs()

            val zipBlockTexturesFolder = fs.rootDirectories.first()
                .resolve("assets")
                .resolve("minecraft")
                .resolve("textures")
                .resolve("block")

            Files.walk(zipBlockTexturesFolder).forEach {
                val relativePath = zipBlockTexturesFolder.relativize(it)
                val destination = blockTexturesFolder.resolve(relativePath.toString())
                if (destination.isDirectory) {
                    destination.mkdirs()
                    return@forEach
                }

                Files.copy(it, destination.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }

            val blockModelsFolder = webDataFolder
                .resolve("models")
                .resolve("block")
            blockModelsFolder.mkdirs()

            val zipBlockModelsFolder = fs.rootDirectories.first()
                .resolve("assets")
                .resolve("minecraft")
                .resolve("models")
                .resolve("block")

            Files.walk(zipBlockModelsFolder).forEach {
                val relativePath = zipBlockModelsFolder.relativize(it)
                val destination = blockModelsFolder.resolve(relativePath.toString())
                if (destination.isDirectory) {
                    destination.mkdirs()
                    return@forEach
                }

                Files.copy(it, destination.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }

            clientFile.delete()
        }
    }

    /**
     * Processes worlds and saves data.
     */
    private suspend fun processWorlds() {
        val worlds = SpigotHelpers.runOnServerThread(plugin) { plugin.server.worlds }
        for (world in worlds) {
            processWorld(world)
        }
    }

    /**
     * Processes a world and saves data.
     *
     * @param world The world to process.
     */
    private suspend fun processWorld(world: World) {
        val worldFolder = SpigotHelpers.runOnServerThread(plugin) { world.worldFolder }
        val regionFolder = worldFolder.resolve("region")
        if (!regionFolder.exists()) {
            return
        }

        val chunkFiles = withContext(Dispatchers.IO) {
            regionFolder.listFiles()?.filter {
                !it.isDirectory && it.name.startsWith("r.") && it.name.split(".").count() == 4 && it.extension == "mca"
            }
        }

        val chunkCoords = chunkFiles?.map {
            val splitName = it.name.split(".")
            VectorXZ(splitName[1].toInt(), splitName[2].toInt())
        }

        chunkCoords?.forEach {
            val chunk = SpigotHelpers.runOnServerThread(plugin) {
                world.getChunkAt(it.x, it.z)
            }

            processChunk(chunk)
        }
    }

    /**
     * Processes a chunk and saves data.
     *
     * @param chunk Chunk to process.
     */
    private suspend fun processChunk(chunk: Chunk) {
        val snapshot = chunk.chunkSnapshot

        val chunkModel = SpigotHelpers.runOnServerThread(plugin) {
            val chunkModel = ChunkModel()

            for (y in Constants.MIN_BLOCK_Y until chunk.world.maxHeight)
                for (x in Constants.MIN_X_FOR_BLOCK_IN_CHUNK..Constants.MAX_X_FOR_BLOCK_IN_CHUNK)
                    for (z in Constants.MIN_Z_FOR_BLOCK_IN_CHUNK..Constants.MAX_Z_FOR_BLOCK_IN_CHUNK) {
                        val blockModel = processBlock(chunk.world.maxHeight, snapshot, x, y, z) ?: continue

                        if (chunkModel.blocks[y] == null) {
                            chunkModel.blocks[y] = mutableMapOf()
                        }

                        if (chunkModel.blocks[y]!![x] == null) {
                            chunkModel.blocks[y]!![x] = mutableMapOf()
                        }

                        chunkModel.blocks[y]!![x]!![z] = blockModel
                    }

            return@runOnServerThread chunkModel
        }

        val chunkJson = Json.encodeToString(chunkModel)

        @Suppress("BlockingMethodInNonBlockingContext")
        withContext(Dispatchers.IO) {
            val worldFolder = webDataFolder
                .resolve(chunk.world.name)
            worldFolder.mkdirs()

            val chunkFile = worldFolder
                .resolve("${chunk.x}.${chunk.z}.json")
            chunkFile.createNewFile()
            chunkFile.writeText(chunkJson)
        }
    }

    /**
     * Processes a block.
     *
     * @param maxHeight Maximum height of the world.
     * @param chunkSnapshot Snapshot of the chunk containing the block.
     * @param x X coordinate of the block in the chunk.
     * @param y Y coordinate of the block in the chunk.
     * @param z Z coordinate of the block in the chunk.
     */
    private fun processBlock(maxHeight: Int, chunkSnapshot: ChunkSnapshot, x: Int, y: Int, z: Int): BlockModel? {
        val blockData = chunkSnapshot.getBlockData(x, y, z)
        if (blockData.material.isAir) {
            var surroundedByAir = true

            if (y > Constants.MIN_BLOCK_Y) {
                surroundedByAir = surroundedByAir && chunkSnapshot.getBlockData(x, y - 1, z).material.isAir
            }

            if (y < maxHeight - 1) {
                surroundedByAir = surroundedByAir && chunkSnapshot.getBlockData(x, y + 1, z).material.isAir
            }

            // Keep edge blocks on X and Z axes in case of needing light information in a different chunk.

            surroundedByAir =
                if (x > Constants.MIN_X_FOR_BLOCK_IN_CHUNK) {
                    surroundedByAir && chunkSnapshot.getBlockData(x - 1, 0, 0).material.isAir
                } else {
                    false
                }

            surroundedByAir =
                if (x < Constants.MIN_X_FOR_BLOCK_IN_CHUNK) {
                    surroundedByAir && chunkSnapshot.getBlockData(x + 1, 0, 0).material.isAir
                } else {
                    false
                }

            surroundedByAir =
                if (z > Constants.MIN_Z_FOR_BLOCK_IN_CHUNK) {
                    surroundedByAir && chunkSnapshot.getBlockData(0, 0, -1).material.isAir
                } else {
                    false
                }

            surroundedByAir =
                if (z < Constants.MIN_Z_FOR_BLOCK_IN_CHUNK) {
                    surroundedByAir && chunkSnapshot.getBlockData(0, 0, 1).material.isAir
                } else {
                    false
                }

            if (surroundedByAir) {
                // If an air block is surrounded by air, the lighting data for that block is not needed.
                return null
            }
        }

        val blockModel = BlockModel()
        blockModel.mat = blockData.material.ordinal

        val data = blockData.asString.substringAfter("[", "").substringBeforeLast("]", "")

        if (data.isNotBlank()) {
            blockModel.data = data
        }

        val defaultLightValue =
            if (blockData.material == Material.AIR) {
                Constants.MAX_LIGHT_LEVEL
            } else {
                Constants.MIN_LIGHT_LEVEL
            }

        val skyLight = chunkSnapshot.getBlockSkyLight(x, y, z)
        val emittedLight = chunkSnapshot.getBlockEmittedLight(x, y, z)

        if (skyLight != defaultLightValue) {
            blockModel.light[LightType.SKY.ordinal] = skyLight
        }

        if (emittedLight != defaultLightValue) {
            blockModel.light[LightType.EMITTED.ordinal] = emittedLight
        }

        return blockModel
    }
}
