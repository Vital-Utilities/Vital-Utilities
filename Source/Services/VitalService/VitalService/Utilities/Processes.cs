using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Management;

namespace VitalService.Utilities
{
    public static class Processes
    {
        public static Process[] GetProcesses()
        {
            return Process.GetProcesses();
        }

        public static List<int> GetProcessChildren(int pid)
        {
            var children = new List<int>();
            var searcher = new ManagementObjectSearcher("Select * From Win32_Process Where ParentProcessID=" + pid);
            ManagementObjectCollection moc = searcher.Get();
            foreach (ManagementObject mo in moc)
            {
                children.Add(Convert.ToInt32(mo["ProcessID"]));
            }
            return children;
        }
    }
}