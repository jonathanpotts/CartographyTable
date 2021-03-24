package com.jonathanpotts.cartographytable.spigot

import kotlinx.coroutines.future.await
import org.bukkit.plugin.java.JavaPlugin
import java.util.concurrent.CompletableFuture

/**
 * Helpers for utilizing Spigot functionality with Kotlin.
 */
object SpigotHelpers {
    /**
     * Runs a function on the server thread allowing access to the Spigot API.
     *
     * @param plugin The server plugin used to call this.
     * @param function The function to run on the server thread.
     * @return The return value of the function after being run on the server thread.
     */
    suspend fun <T> runOnServerThread(plugin: JavaPlugin, function: () -> T): T {
        val future = CompletableFuture<T>()

        plugin.server.scheduler.callSyncMethod(plugin) {
            try {
                future.complete(function.invoke())
            } catch (e: Exception) {
                future.completeExceptionally(e)
            }
        }

        return future.await()
    }
}
