using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VitalService.Dtos.Coms.Process
{
    public class DeleteManagedRequest
    {
        public int ProcessId { get; set; }
        public int ParentProfileId { get; set; }
    }
}
