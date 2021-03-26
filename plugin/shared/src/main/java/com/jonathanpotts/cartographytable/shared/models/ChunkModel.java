package com.jonathanpotts.cartographytable.shared.models;

import java.util.Map;

/**
 * Stores data used to process a chunk.
 */
public class ChunkModel {
    /**
     * A map of coordinates to block models (YXZ format).
     */
    public Map<Integer, Map<Integer, Map<Integer, BlockModel>>> blocks;
}
