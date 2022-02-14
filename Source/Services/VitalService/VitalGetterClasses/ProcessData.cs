using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VitalRustServiceClasses
{
    public class ProcessData
    {
        public int Pid { get; set; }
        public DateTime TimeStamp { get; set; }

        public float GpuCorePercentage { get; set; }
    }


}
