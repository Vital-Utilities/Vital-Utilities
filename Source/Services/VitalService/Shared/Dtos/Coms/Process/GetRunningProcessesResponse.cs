
using System.Collections.Generic;

namespace VitalService.Dtos
{
    public class GetRunningProcessesResponse
    {
        
        public IDictionary<int, ParentChildModelDto> ProcessView { get; set; } = new Dictionary<int, ParentChildModelDto>();

        public class ParentChildModelDto
        {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
            
            public ProcessViewDto Parent { get; set; }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
            
            public HashSet<ProcessViewDto> Children { get; set; } = new HashSet<ProcessViewDto>();
        }
    }
}