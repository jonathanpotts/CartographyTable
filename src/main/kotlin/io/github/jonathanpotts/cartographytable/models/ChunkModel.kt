package io.github.jonathanpotts.cartographytable.models;

public class ChunkModel {
    public var blocks: Map<Short, Map<Byte, Map<Byte, BlockModel>>> = HashMap();
}
