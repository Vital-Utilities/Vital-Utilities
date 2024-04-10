using System;
using System.Collections.Generic;

namespace VitalService.Dtos.Coms.Process
{
    public struct GetProcessesToAddResponse
    {

        public IEnumerable<ProcessToAddDto> Processes { get; set; }
    }
}