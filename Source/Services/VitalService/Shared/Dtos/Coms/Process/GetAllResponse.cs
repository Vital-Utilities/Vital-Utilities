using System;

namespace VitalService.Dtos
{
    public class GetAllResponse
    {
        
        public ManagedModelDto[] ManagedModels { get; set; } = Array.Empty<ManagedModelDto>();
        
        public ProcessToAddDto[] ProcessesToAdd { get; set; } = Array.Empty<ProcessToAddDto>();

    }
}