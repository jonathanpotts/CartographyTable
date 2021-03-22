package io.github.jonathanpotts.cartographytable.models

data class ServerModel(
  val motd: String = "",
  val worlds: List<WorldModel> = ArrayList()
)
