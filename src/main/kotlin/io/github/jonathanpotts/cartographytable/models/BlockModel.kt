package io.github.jonathanpotts.cartographytable.models;

public class BlockModel {
    public var mat: Int = -1;
    public var data: String? = null;
    public var light: Map<Int, Byte> = HashMap();
}
