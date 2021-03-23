package io.github.jonathanpotts.cartographytable

import kotlinx.coroutines.future.await
import org.bukkit.plugin.java.JavaPlugin
import java.util.concurrent.Callable
import java.util.concurrent.CompletableFuture

/**
 * Helpers for utilizing Spigot functionality with Kotlin.
 */
object SpigotHelpers {
    /**
     * Runs a callable on the server thread allowing access to the Spigot API.
     *
     * @param plugin The server plugin used to call this.
     * @param callable The callable to run on the server thread.
     * @return The return value of the callable after being run in the server thread.
     */
    suspend fun <T> runOnServerThread(plugin: JavaPlugin, callable: Callable<T>): T {
        val future = CompletableFuture<T>()

        plugin.server.scheduler.callSyncMethod(plugin) {
            try {
                future.complete(callable.call())
            } catch (e: Exception) {
                future.completeExceptionally(e)
            }
        }

        return future.await()
    }
}
