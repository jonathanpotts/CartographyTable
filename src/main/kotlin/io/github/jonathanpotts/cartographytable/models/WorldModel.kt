package io.github.jonathanpotts.cartographytable.models

/**
 * Stores data needed to process a world.
 * @property name The name of the world.
 * @property spawn The spawn point of the world.
 */
data class WorldModel(
    var name: String = "",
    var spawn: VectorXYZ = VectorXYZ()
)
