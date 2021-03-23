package io.github.jonathanpotts.cartographytable

import io.github.jonathanpotts.cartographytable.models.ServerModel
import io.github.jonathanpotts.cartographytable.models.VectorXYZ
import io.github.jonathanpotts.cartographytable.models.WorldModel
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import kotlinx.coroutines.*
import kotlinx.serialization.*
import kotlinx.serialization.json.*
import org.bukkit.Material
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

        generateServerData()
        generateMaterialData()

        GlobalScope.launch {
            downloadMaterialTexturesAndModels()

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
    private fun generateServerData() {
        webDataFolder.mkdirs()
        val licenseFile = webDataFolder.resolve("LICENSE.txt")
        licenseFile.createNewFile()
        licenseFile.writeText(Constants.MINECRAFT_LICENSE_NOTICE)

        val serverModel = ServerModel()
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

        val serverJson = Json.encodeToString(serverModel)
        val serverFile = webDataFolder.resolve("server.json")
        serverFile.createNewFile()
        serverFile.writeText(serverJson)
    }

    /**
     * Generates material data and saves it.
     */
    private fun generateMaterialData() {
        val materials = Material.values().filter { it.isBlock }
            .associate {
                Pair(
                    it.ordinal,
                    it.createBlockData()
                        .asString
                        .split("[")
                        .first()
                )
            }

        val materialsJson = Json.encodeToString(materials)
        webDataFolder.mkdirs()
        val materialsFile = webDataFolder.resolve("materials.json")
        materialsFile.createNewFile()
        materialsFile.writeText(materialsJson)
    }

    /**
     * Downloads material textures and models.
     */
    private suspend fun downloadMaterialTexturesAndModels() {
        val client = HttpClient(CIO)
        var response: HttpResponse = client.get(Constants.LAUNCHER_VERSION_MANIFEST)

        var responseObject = Json.parseToJsonElement(response.readText()).jsonObject
        val latestRelease = responseObject["latest"]?.jsonObject?.get("release")?.jsonPrimitive?.contentOrNull
            ?: throw IOException("Unable to get version for latest release from Minecraft version manifest")

        val latestReleaseManifest = responseObject["versions"]?.jsonArray?.first { version ->
            version.jsonObject["id"]?.jsonPrimitive?.contentOrNull.equals(latestRelease)
        }?.jsonObject?.get("url")?.jsonPrimitive?.contentOrNull
            ?: throw IOException("Unable to get URL for latest release manifest from Minecraft version manifest")

        response = client.get(latestReleaseManifest)
        responseObject = Json.parseToJsonElement(response.readText()).jsonObject

        val mcClient =
            responseObject["downloads"]?.jsonObject?.get("client")?.jsonObject?.get("url")?.jsonPrimitive?.contentOrNull
                ?: throw IOException("Unable to get URL for client from latest release manifest")

        response = client.get(mcClient)
        val clientFile = withContext(Dispatchers.IO) {
            File.createTempFile("CartographyTable", ".zip")
        }

        clientFile.writeBytes(response.readBytes())

        val fs = withContext(Dispatchers.IO) {
            FileSystems.newFileSystem(clientFile.toPath(), null)
        }

        val blockTexturesFolder = webDataFolder.resolve("textures").resolve("block")
        blockTexturesFolder.mkdirs()

        val zipBlockTexturesFolder = fs.getPath("assets", "minecraft", "textures", "block")

        withContext(Dispatchers.IO) {
            Files.walk(zipBlockTexturesFolder).forEach {
                val destination = blockTexturesFolder.resolve(zipBlockTexturesFolder.relativize(it).toString())
                if (destination.isDirectory) {
                    destination.mkdirs()
                    return@forEach
                }

                Files.copy(it, destination.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
        }

        val blockModelsFolder = webDataFolder.resolve("models").resolve("block")
        blockModelsFolder.mkdirs()

        val zipBlockModelsFolder = fs.getPath("assets", "minecraft", "models", "block")

        withContext(Dispatchers.IO) {
            Files.walk(zipBlockModelsFolder).forEach {
                val destination = blockModelsFolder.resolve(zipBlockModelsFolder.relativize(it).toString())
                if (destination.isDirectory) {
                    destination.mkdirs()
                    return@forEach
                }

                Files.copy(it, destination.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
        }

        clientFile.delete()
    }
}
