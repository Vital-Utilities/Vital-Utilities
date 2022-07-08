using System;

namespace VitalService.Dtos
{
    public class GetAllResponse
    {
        [SwaggerRequired]
        public ManagedModelDto[] ManagedModels { get; set; } = Array.Empty<ManagedModelDto>();
        [SwaggerRequired]
        public ProcessToAddDto[] ProcessesToAdd { get; set; } = Array.Empty<ProcessToAddDto>();

    }
}