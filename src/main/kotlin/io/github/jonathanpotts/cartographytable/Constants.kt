package io.github.jonathanpotts.cartographytable

/**
 * Constants used by CartographyTable.
 */
object Constants {
    /**
     * The minimum value for Y when referring to a block's location.
     */
    const val MIN_BLOCK_Y = 0

    /**
     * The minimum value for X when referring to a block's location in a chunk.
     */
    const val MIN_X_FOR_BLOCK_IN_CHUNK = 0

    /**
     * The maximum value for X when referring to a block's location in a chunk.
     */
    const val MAX_X_FOR_BLOCK_IN_CHUNK = 15

    /**
     * The minimum value for Z when referring to a block's location in a chunk.
     */
    const val MIN_Z_FOR_BLOCK_IN_CHUNK = 0

    /**
     * The maximum value for Z when referring to a block's location in a chunk.
     */
    const val MAX_Z_FOR_BLOCK_IN_CHUNK = 15

    /**
     * The minimum value for a stored lighting level.
     */
    const val MIN_LIGHT_LEVEL = 0

    /**
     * The maximum value for a stored lighting level.
     */
    const val MAX_LIGHT_LEVEL = 15

    /**
     * The location of the Minecraft launcher version manifest file.
     */
    const val LAUNCHER_VERSION_MANIFEST =
        "https://launchermeta.mojang.com/mc/game/version_manifest.json"

    /**
     * The notice for the Minecraft EULA.
     */
    const val MINECRAFT_LICENSE_NOTICE =
        "Use of this data is subject to the Minecraft EULA - " +
                "https://account.mojang.com/documents/minecraft_eula"
}
