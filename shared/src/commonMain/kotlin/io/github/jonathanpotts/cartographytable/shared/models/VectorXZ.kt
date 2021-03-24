package io.github.jonathanpotts.cartographytable.shared.models

import kotlinx.serialization.Serializable

/**
 * Stores a 2D vector containing an X and Z coordinate.
 *
 * @property x X coordinate.
 * @property z Z coordinate.
 */
@Serializable
data class VectorXZ(
    var x: Int = 0,
    var z: Int = 0
)
