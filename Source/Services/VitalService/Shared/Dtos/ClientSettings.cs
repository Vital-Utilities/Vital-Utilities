using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VitalService.Dtos
{
    public class ClientSettings
    {
        [SwaggerRequired]
        public bool AlwaysOnTop { get; set; }
    }
}
