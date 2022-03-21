using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using VitalService.Dtos;

namespace VitalService.Stores
{
    public class SettingsStore
    {
        /// <summary>
        /// Do not mutate  this, call the UpdateSettings method instead.
        /// </summary>
        public SettingsDto Settings { get; private set; }

        private readonly string SettingsPath = Path.Combine(Program.appDocumentsDir, "Settings.json");
        private readonly JsonSerializerOptions jsonSetting;

        public SettingsStore()
        {
            var settings = new JsonSerializerOptions();
            settings.Converters.Add(new JsonStringEnumConverter());
            settings.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            settings.WriteIndented = true;
            settings.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
            jsonSetting = settings;

            if (!File.Exists(SettingsPath))
            {
                Directory.CreateDirectory(Program.appDocumentsDir);


                var jsonString = JsonSerializer.Serialize(new SettingsDto(), jsonSetting);
                File.WriteAllText(SettingsPath, jsonString);
            }

            var settingsJson = File.ReadAllText(SettingsPath);

            Settings = JsonSerializer.Deserialize<SettingsDto>(settingsJson, jsonSetting)!;

            Merge();
        }

        public void UpdateSettings(SettingsDto settings)
        {
            File.WriteAllText(SettingsPath, JsonSerializer.Serialize(settings, jsonSetting));
            Settings = settings;
        }
        /// <summary>
        /// Merges settings on disk with settings in memory for very basic migration.
        /// Takes setting value in file over memory.
        /// </summary>
        private void Merge()
        {
            var settingsJson = File.ReadAllText(SettingsPath);

            var settings = JsonSerializer.Deserialize<SettingsDto>(settingsJson, jsonSetting)!;

            var fileOnDisk = JObject.Parse(settingsJson);

            var jsonString = JsonSerializer.Serialize(new SettingsDto(), jsonSetting);
            var jsonInMemory = JObject.Parse(jsonString);

            var propertyNames = fileOnDisk.Properties().Select(p => p.Name);

            var result = new JObject();

            foreach (var property in propertyNames)
            {
                JToken value;
                if (!jsonInMemory.TryGetValue(property, out value))
                    value = fileOnDisk.GetValue(property);

                result.Add(property, value);
            }

            Settings = JsonSerializer.Deserialize<SettingsDto>(result.ToString(), jsonSetting)!;
            UpdateSettings(Settings);
        }
    }
}
