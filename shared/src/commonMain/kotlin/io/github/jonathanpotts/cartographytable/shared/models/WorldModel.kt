package io.github.jonathanpotts.cartographytable.shared.models

import kotlinx.serialization.Serializable

/**
 * Stores data needed to process a world.
 * @property name The name of the world.
 * @property spawn The spawn point of the world.
 */
@Serializable
data class WorldModel(
    var name: String = "",
    var spawn: VectorXYZ = VectorXYZ()
)
