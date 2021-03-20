package com.jonathanpotts.cartographytable;

import java.lang.reflect.Field;
import java.lang.reflect.Type;

import com.google.common.base.Defaults;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

public class ExcludeDefaultValuesJsonSerializer<T> implements JsonSerializer<T> {
    @Override
    public JsonElement serialize(T src, Type typeOfSrc, JsonSerializationContext context) {
        Gson gson = new Gson();
        JsonObject jsonObject = (JsonObject)gson.toJsonTree(src);

        for (Field field : src.getClass().getFields()) {
            try {
                Object value = field.get(src);
                Object defaultValue = Defaults.defaultValue(field.getType());

                if (value.equals(defaultValue)) {
                    jsonObject.remove(field.getName());
                }
            } catch (IllegalAccessException e) {
                // Not sure if field has default value, so don't exclude.
            }
        }

        return jsonObject;
    }
}
