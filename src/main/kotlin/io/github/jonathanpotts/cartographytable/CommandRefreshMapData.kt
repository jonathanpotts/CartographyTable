package io.github.jonathanpotts.cartographytable

import io.github.jonathanpotts.cartographytable.models.ServerModel
import io.github.jonathanpotts.cartographytable.models.VectorXYZ
import io.github.jonathanpotts.cartographytable.models.WorldModel
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.bukkit.Material
import org.bukkit.command.Command
import org.bukkit.command.CommandExecutor
import org.bukkit.command.CommandSender
import org.bukkit.plugin.java.JavaPlugin

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
    )
            : Boolean {
        if (isExecuting) {
            plugin.logger.info("Map data is already being refreshed")
            return true
        }

        isExecuting = true

        generateServerData()

        isExecuting = false
        return true
    }

    /**
     * Generates server data and saves it.
     */
    private fun generateServerData() {
        webDataFolder.resolve("LICENSE.txt")
            .writeText(Constants.MINECRAFT_LICENSE_NOTICE)

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
        webDataFolder.resolve("server.json")
            .writeText(serverJson)
    }

    /**
     * Generates material data and saves it.
     */
    private fun generateMaterialData() {
        val materials = Material.values().associate { material ->
            Pair(
                material.ordinal,
                material.createBlockData()
                    .asString
                    .split("[")
                    .first()
            )
        }

        val materialsJson = Json.encodeToString(materials)
        webDataFolder.resolve("materials.json")
            .writeText(materialsJson)

        downloadMaterialTexturesAndModels()
    }

    /**
     * Downloads material textures and models.
     */
    private fun downloadMaterialTexturesAndModels() {

    }
}
