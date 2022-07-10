using System;
using System.Collections.Generic;

namespace VitalService.Dtos
{
    public struct GetProcessesToAddResponse
    {
        
        public IEnumerable<ProcessToAddDto> Processes { get; set; }
    }
}