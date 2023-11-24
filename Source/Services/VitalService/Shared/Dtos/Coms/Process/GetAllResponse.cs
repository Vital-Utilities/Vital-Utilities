using System;

namespace VitalService.Dtos.Coms.Process
{
    public class GetAllResponse
    {

        public ManagedModelDto[] ManagedModels { get; set; } = Array.Empty<ManagedModelDto>();

        public ProcessToAddDto[] ProcessesToAdd { get; set; } = Array.Empty<ProcessToAddDto>();

    }
}