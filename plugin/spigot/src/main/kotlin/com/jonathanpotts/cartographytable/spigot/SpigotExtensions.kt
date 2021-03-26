package com.jonathanpotts.cartographytable.spigot

import kotlinx.coroutines.future.await
import org.bukkit.plugin.java.JavaPlugin
import java.util.concurrent.CompletableFuture

/**
 * Runs a function on the server thread allowing access to the Spigot API.
 *
 * @param T The return type of the function.
 * @param function The function to run on the server thread.
 * @return The return value of the function after being run on the server thread.
 */
suspend fun <T> JavaPlugin.runOnServerThread(function: () -> T): T {
    val future = CompletableFuture<T>()

    this.server.scheduler.callSyncMethod(this) {
        try {
            future.complete(function.invoke())
        } catch (e: Exception) {
            future.completeExceptionally(e)
        }
    }

    return future.await()
}
