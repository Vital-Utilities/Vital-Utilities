using System;
using System.ComponentModel.DataAnnotations;

namespace VitalService.Dtos.Coms.Process
{
    public class GetManagedResponse
    {
        [Required]
        public ManagedModelDto[] AffinityModels { get; set; } = Array.Empty<ManagedModelDto>();
    }
}