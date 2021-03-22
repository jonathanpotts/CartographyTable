package io.github.jonathanpotts.cartographytable.models

/**
 * Stores a 3D vector containing a X, Y, and Z coordinate.
 *
 * @property x X coordinate.
 * @property y Y coordinate.
 * @property z Z coordinate.
 */
data class VectorXYZ(
    var x: Int = 0,
    var y: Int = 0,
    var z: Int = 0
)
