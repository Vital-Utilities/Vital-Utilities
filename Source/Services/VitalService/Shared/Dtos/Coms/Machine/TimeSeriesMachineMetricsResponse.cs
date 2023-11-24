using System;
using System.Collections.Generic;
using VitalService.Dtos.Data.Metrics;

namespace VitalService.Dtos.Coms.Machine
{
    public class TimeSeriesMachineMetricsResponse
    {

        public DateRange RequestRange { get; set; }

        public IEnumerable<TimeSeriesMachineMetricsModel> Metrics { get; set; }

    }
    public class DateRange
    {

        public DateTime Earliest { get; set; }

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
