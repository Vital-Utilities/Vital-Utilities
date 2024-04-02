using System;
using Newtonsoft.Json;

namespace VitalService.Utilities;

public class SingleConverter : JsonConverter<float>
{
    public override float ReadJson(JsonReader reader, Type objectType, float existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        // Implement custom logic to convert the JSON value to a float
        // This is just a placeholder; you'll need to implement the actual conversion logic
        return Convert.ToSingle(reader.Value);
    }

    public override void WriteJson(JsonWriter writer, float value, JsonSerializer serializer)
    {
        // Implement custom logic to write the float value as JSON
        writer.WriteValue(value);
    }
}