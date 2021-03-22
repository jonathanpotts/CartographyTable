package io.github.jonathanpotts.cartographytable.models

/**
 * Stores data used to process a chunk.
 *
 * @property blocks A map of coordinates to block models (YXZ format).
 */
data class ChunkModel(
    var blocks: MutableMap<Short, Map<Byte, Map<Byte, BlockModel>>> =
        mutableMapOf()
)
