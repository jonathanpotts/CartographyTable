package io.github.jonathanpotts.cartographytable.models

class ChunkModel {
  var blocks: Map<Short, Map<Byte, Map<Byte, BlockModel>>> = HashMap()
}
