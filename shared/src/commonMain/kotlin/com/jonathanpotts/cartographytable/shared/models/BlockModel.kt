package com.jonathanpotts.cartographytable.shared.models

import kotlinx.serialization.Serializable

/**
 * Stores data used to process a block.
 *
 * @property mat Material ID ordinal.
 * @property data Additional block data.
 * @property light Map containing lighting data.
 */
@Serializable
data class BlockModel(
    var mat: Int = -1,
    var data: String? = null,
    var light: MutableMap<Int, Int> = mutableMapOf()
)
