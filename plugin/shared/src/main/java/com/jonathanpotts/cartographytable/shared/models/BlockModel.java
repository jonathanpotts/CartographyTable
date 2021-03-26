package com.jonathanpotts.cartographytable.shared.models;

import java.util.Map;

/**
 * Stores data used to process a block.
 */
public class BlockModel {
    /**
     * Material ID ordinal.
     */
    public int mat;

    /**
     * Additional block data.
     */
    public String data;

    /**
     * Map containing lighting data.
     */
    public Map<Integer, Integer> light;
}
