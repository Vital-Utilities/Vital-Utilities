using System;
using System.Collections.Generic;
using VitalService.Dtos.Data.Metrics;

namespace VitalService.Dtos.Coms
{
    public class TimeSeriesMachineMetricsResponse
    {
        [SwaggerRequired]
        public DateRange RequestRange { get; set; }
        [SwaggerRequired]
        public IEnumerable<TimeSeriesMachineMetricsModel> Metrics { get; set; }

    }
    public class DateRange
    {
        [SwaggerRequired]
        public DateTime Earliest { get; set; }
        [SwaggerRequired]
        public DateTime Latest { get; set; }

        public DateRange()
        {

        }
        public DateRange(DateTime earliest, DateTime latest)
        {
            Earliest = earliest;
            Latest = latest;
        }
    }
}
