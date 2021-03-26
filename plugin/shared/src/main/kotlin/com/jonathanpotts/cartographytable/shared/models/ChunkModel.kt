package com.jonathanpotts.cartographytable.shared.models

import kotlinx.serialization.Serializable

/**
 * Stores data used to process a chunk.
 *
 * @property blocks A map of coordinates to block models (YXZ format).
 */
@Serializable
data class ChunkModel(
    var blocks: MutableMap<Int, MutableMap<Int, MutableMap<Int, BlockModel>>> =
        mutableMapOf()
)
