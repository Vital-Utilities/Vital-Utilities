using System;
using System.Collections.Generic;
using System.IO;
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
        }

        public void UpdateSettings(SettingsDto settings)
        {
            File.WriteAllText(SettingsPath, JsonSerializer.Serialize(settings, jsonSetting));
            Settings = settings;
        }
    }
}
