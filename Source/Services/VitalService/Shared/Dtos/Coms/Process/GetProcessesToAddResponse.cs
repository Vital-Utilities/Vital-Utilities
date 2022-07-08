using System;
using System.Collections.Generic;

namespace VitalService.Dtos
{
    public struct GetProcessesToAddResponse
    {
        [SwaggerRequired]
        public IEnumerable<ProcessToAddDto> Processes { get; set; }
    }
}