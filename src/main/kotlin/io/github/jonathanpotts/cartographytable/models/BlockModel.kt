package io.github.jonathanpotts.cartographytable.models

data class BlockModel(
  val mat: Int = -1,
  val data: String? = null,
  val light: Map<Int,Byte> = HashMap()
)
