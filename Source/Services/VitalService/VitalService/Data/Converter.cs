
using System;
using System.Linq;
using System.Threading.Tasks;
using VitalService.Data.App;
using VitalService.Dtos;
using VitalService.Stores;

namespace VitalService.Data
{
    public static class Converter
    {

        public static ManagedModelDto ToDto(this ManagedModel model)
        {
            return new ManagedModelDto(
                model.Id,
                model.ProcessName,
                model.Alias,
                model.ProcessPriority,
                Utilities.Affinity.BinaryStringToIntArray(model.AffinityBinary),
                model.ParentProfileId
            );
        }
        public static async Task<ProfileModel> ToModelAsync(this ProfileDto dto, IManagedProcessStore affinityStore)
        {
            var models = await affinityStore.GetAsync(dto.ManagedModelsIds);

            return new ProfileModel
            (
                dto.Id,
                dto.Name,
                models.ToList(),
                dto.Enabled,
                dto.Priority
            );
        }

        public static ProfileDto ToDto(this ProfileModel model)
        {
            return new ProfileDto(
                model.Id,
                model.Name,
                model.ManagedModels?.Select(e => e.Id).ToArray() ?? Array.Empty<int>(),
                model.Enabled,
                true,
                model.Priority);
        }

    }
}
