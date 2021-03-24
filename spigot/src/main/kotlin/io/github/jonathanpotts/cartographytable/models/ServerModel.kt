package io.github.jonathanpotts.cartographytable.models

import kotlinx.serialization.Serializable

/**
 * Stores data used to process a server.
 *
 * @property motd Message of the day on the server.
 * @property worlds Worlds on the server.
 */
@Serializable
data class ServerModel(
    var motd: String = "",
    var worlds: MutableList<WorldModel> = mutableListOf()
)
