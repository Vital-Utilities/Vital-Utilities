using System;

namespace VitalService.Dtos
{
    public class GetManagedResponse
    {
        public ManagedModelDto[] AffinityModels { get; set; } = Array.Empty<ManagedModelDto>();
    }
}