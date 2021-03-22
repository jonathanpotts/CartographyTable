package io.github.jonathanpotts.cartographytable.models

data class ChunkModel(
  val blocks: Map<Short, Map<Byte, Map<Byte, BlockModel>>> = HashMap()
)
