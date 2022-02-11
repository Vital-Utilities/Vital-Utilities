using System;
using System.Management;

namespace VitalService.Services.PerformanceServices
{
    public class ProcessPerfWmiQueryer : IDisposable
    {
        readonly ManagementObjectSearcher searcher = new(new
            SelectQuery("SELECT Name, IDProcess, WorkingSetPrivate, PercentProcessorTime, IOReadBytesPersec, IOWriteBytesPersec FROM Win32_PerfFormattedData_PerfProc_Process"));
        readonly ManagementOperationObserver results = new();
        public event ObjectReadyEventHandler? ObjectReady;
        public bool ReadyToInvoke { get; private set; } = true;

        public ProcessPerfWmiQueryer()
        {
            results.ObjectReady += (sender, e) => ObjectReady?.Invoke(sender, e);
            results.Completed += Done;
        }
        public void InvokeGet()
        {
            if (!ReadyToInvoke)
                return;
            ReadyToInvoke = false;
            searcher.Get(results);
        }


        private void Done(object sender, CompletedEventArgs obj)
        {
            ReadyToInvoke = true;
        }

        public void Dispose()
        {
            searcher.Dispose();
            results.Cancel();
        }
    }
}
