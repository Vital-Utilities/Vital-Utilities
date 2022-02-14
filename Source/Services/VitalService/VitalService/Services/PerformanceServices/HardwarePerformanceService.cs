using JM.LinqFaster;
using LibreHardwareMonitor.Hardware;
using Microsoft.Extensions.Hosting;
using Microsoft.Management.Infrastructure;
using Serilog;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Management;
using System.Net.NetworkInformation;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using VitalService.Dtos.Coms;
using VitalService.Dtos.Data;

namespace VitalService.Services.PerformanceServices
{
    public class HardwarePerformanceService : IHostedService
    {
        public GetMachineStaticDataResponse MachineStaticData { get; set; } = new();
        public RamUsages CurrentRamUsage { get { lastServiceAccess = DateTime.Now; return ramUsageData; } }
        public List<GpuUsages> CurrentGpuUsage { get { lastServiceAccess = DateTime.Now; return gpuUsageData; } }
        public CpuUsages CurrentCpuUsage { get { lastServiceAccess = DateTime.Now; return cpuUsageData; } }
        public DiskUsages CurrentDiskUsages { get { lastServiceAccess = DateTime.Now; return diskUsagesData; } }
        public NetworkAdapters CurrentNetworkUsage { get { lastServiceAccess = DateTime.Now; return networkUsageData; } }

        private List<GpuUsages> gpuUsageData = new();
        private CpuUsages cpuUsageData = new();
        private RamUsages ramUsageData = new();
        private NetworkAdapters networkUsageData = new();
        private bool IsUpdatingCpuUsage { get; set; }
        private bool IsUpdatingDiskUsage { get; set; }
        private bool IsUpdatingNetworkUsage { get; set; }
        private Timer UpdateHardwareUsageDataTimer { get; set; }
        private Timer AutoThrottlerTimer { get; set; }
        private DateTime lastServiceAccess;
        private DiskUsages diskUsagesData = new();

        public bool ThrottleActive { get; private set; }
        private TimeSpan throttleAfter = TimeSpan.FromSeconds(10);
        private UpdateVisitor updateVisitor { get; set; } = new UpdateVisitor();
        private readonly Computer computer = new()
        {
            IsCpuEnabled = true,
            IsGpuEnabled = true,
            IsMemoryEnabled = true,
            IsMotherboardEnabled = true,
            IsControllerEnabled = false,
            IsNetworkEnabled = true,
            IsStorageEnabled = true,

        };
        public HardwarePerformanceService()
        {
            computer.Open();
            SetStaticData();

            AutoThrottlerTimer = new Timer((_) => AutoThrottle(), null, Timeout.Infinite, Timeout.Infinite);
            UpdateHardwareUsageDataTimer = new Timer((_) =>
            {
                computer.Accept(updateVisitor);
                Task.Run(() => UpdateCpuUsage());
                Task.Run(() => UpdateRamUsage());
                Task.Run(() => UpdateGpuUsage());
                Task.Run(() => UpdateNetworkUsage());
                Task.Run(() => UpdateDiskUsage());
            }, null, Timeout.Infinite, Timeout.Infinite);
        }


        private void SetStaticData()
        {
            computer.Accept(new UpdateVisitor());
            var data = new GetMachineStaticDataResponse();

            foreach (var hardwareItem in computer.Hardware)
            {
                if (hardwareItem.HardwareType == HardwareType.GpuNvidia || hardwareItem.HardwareType == HardwareType.GpuAmd)
                {

                    var memoryTotal = hardwareItem.Sensors.FirstOrDefault(x => x.Name == "GPU Memory Total")?.Value;
                    var gpu = new GpuData
                    {
                        Name = hardwareItem.Name.Trim(),
                        MemoryTotalBytes = memoryTotal is null ? null : memoryTotal * 1024 * 1024
                    };
                    data.Gpu.Add(gpu);
                }
                if (hardwareItem.HardwareType == HardwareType.Cpu)
                {
                    var cpu = data.Cpu;
                    cpu.Name = hardwareItem.Name.Trim();
                    var session = CimSession.Create(null) // null instead of localhost which would otherwise require certain MMI services running
                                            .QueryInstances(@"root\cimv2", "WQL", "SELECT Name, ThreadCount, NumberOfCores, NumberOfEnabledCore, VirtualizationFirmwareEnabled FROM Win32_Processor");
                    foreach (var queryObj in session)
                    {

                        foreach (var propertyInfo in typeof(CpuData).GetProperties())
                        {
                            if (!propertyInfo.Name.Contains("CacheSize"))
                                propertyInfo.SetValue(cpu, Convert.ChangeType(queryObj.CimInstanceProperties[propertyInfo.Name]?.Value ?? "", propertyInfo.PropertyType), null);
                        }
                    }

                    session = CimSession.Create(null) // null instead of localhost which would otherwise require certain MMI services running
                                            .QueryInstances(@"root\cimv2", "WQL", $"SELECT DeviceId, MaxCacheSize FROM Win32_CacheMemory");

                    foreach (var queryObj in session)
                    {
                        var val = (float)Convert.ChangeType(queryObj.CimInstanceProperties["MaxCacheSize"].Value ?? "", typeof(float));
                        switch (queryObj.CimInstanceProperties["DeviceId"].Value)
                        {
                            case "Cache Memory 0":
                                cpu.L1CacheSize = val;
                                break;
                            case "Cache Memory 1":
                                cpu.L2CacheSize = val;
                                break;
                            case "Cache Memory 2":
                                cpu.L3CacheSize = val;
                                break;
                            default:
                                Log.Logger.Error("more than three cpu cache was found");
                                break;
                        }
                    }
                }
            }

            var ramSession = CimSession.Create(null) // null instead of localhost which would otherwise require certain MMI services running
                        .QueryInstances(@"root\cimv2", "WQL", "SELECT PartNumber, Speed, ConfiguredClockSpeed, Capacity, DeviceLocator, BankLabel FROM Win32_PhysicalMemory");
            foreach (var queryObj in ramSession)
            {
                var ram = new RamData
                {
                    PartNumber = (string)Convert.ChangeType(queryObj.CimInstanceProperties["PartNumber"].Value, typeof(string)),
                    SpeedMhz = (uint)Convert.ChangeType(queryObj.CimInstanceProperties["Speed"].Value, typeof(uint)),
                    ConfiguredClockSpeedMhz = (uint)Convert.ChangeType(queryObj.CimInstanceProperties["ConfiguredClockSpeed"].Value, typeof(uint)),
                    Capacity = (double)Convert.ChangeType(queryObj.CimInstanceProperties["Capacity"].Value, typeof(double))
                };
                var slotName = queryObj.CimInstanceProperties["DeviceLocator"].Value as string;
                if (slotName != null)
                {
                    var rgx = new Regex(@"/\d +$/");
                    var split = rgx.Match(slotName);
                    int? slotNumber = null;
                    if (split.Success) slotNumber = int.Parse(split.Value);
                    ram.SlotNumber = slotNumber;
                }

                ram.SlotChannel = (string?)Convert.ChangeType(queryObj.CimInstanceProperties["BankLabel"].Value, typeof(string));

                data.Ram.Add(ram);
            }
            MachineStaticData = data;
        }
        private void UpdateNetworkUsage()
        {
            if (IsUpdatingNetworkUsage)
                return;
            IsUpdatingNetworkUsage = true;
            try
            {
                Utilities.Debug.LogExecutionTime(null, () =>
                {
                    var adapters = NetworkInterface.GetAllNetworkInterfaces().ToDictionary(k => k.Name, v => v);

                    var toReturn = new NetworkAdapters();
                    foreach (var hardwareItem in computer.Hardware)
                    {
                        if (hardwareItem.HardwareType == HardwareType.Network
                        && adapters.TryGetValue(hardwareItem.Name, out var adapter)
                        && adapter.OperationalStatus is not OperationalStatus.Down or OperationalStatus.Unknown or OperationalStatus.NotPresent)
                        {
                            var ipProperties = adapter.GetIPProperties();
                            var adapterObj = new NetworkAdapters.NetworkAdapter()
                            {
                                Properties = new NetworkAdapters.Properties
                                {
                                    Name = adapter.Name,
                                    Description = adapter.Description,
                                    SpeedBps = adapter.Speed,
                                    ConnectionType = Enum.GetName(adapter.NetworkInterfaceType) ?? "Unknown",
                                    IPInterfaceProperties = new NetworkAdapters.IPInterfaceProperties()
                                    {
                                        IPv4Address = ipProperties.UnicastAddresses.FirstOrDefault(e => e.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)?.Address.ToString(),
                                        IPv6Address = ipProperties.UnicastAddresses.FirstOrDefault(e => e.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)?.Address.ToString(),
                                        DnsSuffix = ipProperties.DnsSuffix,
                                        IsDnsEnabled = ipProperties.IsDnsEnabled
                                    },
                                    MacAddress = adapter.GetPhysicalAddress().ToString()
                                }
                            };

                            foreach (var sensor in hardwareItem.Sensors)
                            {
                                if (sensor.Value != null)
                                    switch (sensor.Name)
                                    {
                                        case "Data Uploaded":
                                            adapterObj.Usage.UploadedBps = (ulong)sensor.Value;
                                            break;
                                        case "Data Downloaded":
                                            adapterObj.Usage.DownloadedBps = (ulong)sensor.Value;
                                            break;
                                        case "Upload Speed":
                                            adapterObj.Usage.UploadSpeedBps = (long)sensor.Value;
                                            break;
                                        case "Download Speed":
                                            adapterObj.Usage.DownloadSpeedBps = (long)sensor.Value;
                                            break;
                                        case "Network Utilization":
                                            adapterObj.Usage.UsagePercentage = (long)sensor.Value;
                                            break;
                                        default:
                                            break;
                                    }

                            }
                            toReturn.Adapters.TryAdd(hardwareItem.Name, adapterObj);
                        }
                    }
                    networkUsageData = toReturn;
                });
            }
            finally
            {
                IsUpdatingNetworkUsage = false;
            }

        }
        public class RamUsageRaw
        {
            /// <summary>
            /// Bytes
            /// </summary>
            public float FreePhysicalMemory { get; set; }

            /// <summary>
            /// Bytes
            /// </summary>
            public float TotalVisibleMemorySize { get; set; }
        }
        private void UpdateGpuUsage()
        {
            Utilities.Debug.LogExecutionTime(null, () =>
            {
                var toReturn = new List<GpuUsages>();
                foreach (var hardwareItem in computer.Hardware.Where(e => e.HardwareType is HardwareType.GpuNvidia or HardwareType.GpuAmd))
                {
                    var gpu = new GpuUsages();
                    foreach (var sensor in hardwareItem.Sensors)
                    {
                        if (sensor.Value != null)
                            switch (sensor.SensorType)
                            {
                                case SensorType.Temperature:
                                    {
                                        var value = sensor.Value;
                                        if (value is not null)
                                        {
                                            if (sensor.Name == "GPU Core")
                                                gpu.TemperatureReadings.AddOrUpdate("GPU Core", (float)value, (key, oldValue) => oldValue = (float)value);
                                            else
                                                gpu.TemperatureReadings.AddOrUpdate(sensor.Name, (float)value, (key, oldValue) => oldValue = (float)value);
                                        }
                                        break;
                                    }
                                case SensorType.Load:
                                    {
                                        var value = sensor.Value;
                                        switch (sensor.Name)
                                        {
                                            case "GPU Core":
                                                gpu.Load.Core = value;
                                                break;
                                            case "GPU Frame Buffer":
                                                gpu.Load.FrameBuffer = value;
                                                break;
                                            case "GPU Video Engine":
                                                gpu.Load.VideoEngine = value;
                                                break;
                                            case "GPU Bus":
                                                gpu.Load.BusInterface = value;
                                                break;
                                            case "GPU Memory":
                                                gpu.Load.Memory = value;
                                                break;
                                            case "GPU Memory Controller":
                                                gpu.Load.MemoryController = value;
                                                break;
                                            //case "D3D Cuda":
                                            //    gpu.Load.Cuda = value;
                                            //    break;
                                            //case "D3D 3D":
                                            //    gpu.Load.ThreeD = value;
                                            //    break;
                                            default:
                                                break;
                                        }
                                        break;
                                    }
                                case SensorType.Clock:
                                    {
                                        var value = sensor.Value;
                                        switch (sensor.Name)
                                        {
                                            case "GPU Core":
                                                gpu.CoreClockMhz = value;
                                                break;
                                            case "GPU Memory":
                                                gpu.MemoryClockMhz = value;
                                                break;
                                            case "GPU Shader":
                                                gpu.ShaderClockMhz = value;
                                                break;
                                            default:
                                                break;
                                        }
                                        break;
                                    }
                                case SensorType.Control:
                                    {
                                        if (sensor.Name.Contains("Fan"))
                                        {
                                            _ = gpu.FanPercentage?.TryAdd(sensor.Name, (float)sensor.Value);
                                        }
                                        break;
                                    }
                                case SensorType.SmallData:
                                    {
                                        var value = sensor.Value * 1024 * 1024;
                                        switch (sensor.Name)
                                        {
                                            case "GPU Memory Used":
                                                gpu.MemoryUsedBytes = value;
                                                break;
                                            case "GPU Memory Total":
                                                gpu.TotalMemoryBytes = value;
                                                break;
                                        }
                                        break;
                                    }
                                case SensorType.Power:
                                    {

                                        gpu.PowerDraw = (float)Math.Round((float)sensor.Value, 2);
                                        break;
                                    }

                                case SensorType.Throughput:
                                    {
                                        var value = (ulong)sensor.Value;
                                        switch (sensor.Name)
                                        {
                                            case "GPU PCIe Rx":
                                                gpu.PCIe_Throughput.PCIe_Rx_BytesPerSecond = value;
                                                break;
                                            case "GPU PCIe Tx":
                                                gpu.PCIe_Throughput.PCIe_Tx_BytesPerSecond = value;
                                                break;

                                            default:
                                                var exeption = new NotImplementedException($"{sensor.Name} is not handled");
                                                Log.Logger.Error(exeption, "Unhandled GPU Throughput Data");
                                                break;
                                        }
                                        break;
                                    }
                            }

                    }
                    toReturn.Add(gpu);
                }

                gpuUsageData = toReturn;
            });
        }
        private void UpdateCpuUsage()
        {
            if (IsUpdatingCpuUsage)
                return;
            IsUpdatingCpuUsage = true;
            try
            {
                Utilities.Debug.LogExecutionTime(null, () =>
                {
                    var searcher = new ManagementObjectSearcher("root\\CIMV2", "SELECT Name, PercentProcessorTime FROM Win32_PerfFormattedData_PerfOS_Processor");
                    var toReturn = new CpuUsages();
                    var coresBeforeSort = new SortedDictionary<int, float>();

                    try
                    {
                        foreach (ManagementObject queryObj in searcher.Get())
                        {
                            if (queryObj["Name"].ToString() == "_Total")
#pragma warning disable CS8604 // Possible null reference argument.

                                toReturn.Total = (float)Math.Round(double.Parse(queryObj["PercentProcessorTime"].ToString()), 2);

                            else
                                coresBeforeSort.Add(int.Parse(queryObj["Name"].ToString()), float.Parse(queryObj["PercentProcessorTime"].ToString()));
#pragma warning restore CS8604 // Possible null reference argument.
                        }

                        toReturn.Cores = coresBeforeSort.Values.ToList();
                    }
                    catch (Exception e)
                    {
                        Log.Logger.Error(e.Message, e);
                    }

                    foreach (var hardwareItem in computer.Hardware.Where(e => e.HardwareType == HardwareType.Cpu))
                    {
                        foreach (var sensor in hardwareItem.Sensors)
                        {
                            switch (sensor.SensorType)
                            {
                                case SensorType.Temperature:
                                    if (sensor.Value != null)
                                        if (sensor.Name.Contains("Max") || sensor.Name.Contains("Average"))
                                            continue;
                                        else if (sensor.Name == "Core (Tctl/Tdie)")
                                            toReturn.TemperatureReadings.TryAdd("CPU Package", (float)Math.Round((float)sensor.Value, 2));
                                        else
                                            toReturn.TemperatureReadings.TryAdd(sensor.Name, (float)Math.Round((float)sensor.Value, 2));
                                    break;
                                case SensorType.Clock:
                                    if (sensor.Value == null || !sensor.Name.Contains("Core"))
                                        continue;
                                    toReturn.CoreClocksMhz.Add((int)sensor.Value);
                                    break;
                                case SensorType.Power:
                                    if (sensor.Value != null && sensor.Name == "Package" && sensor.Value != null)
                                        toReturn.PowerDrawWattage = (float)Math.Round((float)sensor.Value, 2);
                                    break;
                            }
                        }
                    }

                    cpuUsageData = toReturn;
                });
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                IsUpdatingCpuUsage = false;
            }

        }

        private void UpdateDiskUsage()
        {
            if (IsUpdatingDiskUsage)
                return;
            IsUpdatingDiskUsage = true;
            try
            {
                Utilities.Debug.LogExecutionTime(null, () =>
                {

                    var toReturn = new DiskUsages();
                    var drives = DriveInfo.GetDrives();
                    foreach (var hardwareItem in computer.Hardware.Where(e => e.HardwareType == HardwareType.Storage))
                    {

                        var disk = new DiskUsages.Usage() { Name = hardwareItem.Name };

                        var generic = hardwareItem as LibreHardwareMonitor.Hardware.Storage.AbstractStorage;
                        var letter = generic?.DriveInfos[0].Name ?? "";
                        var obj = GetInstanceField(typeof(LibreHardwareMonitor.Hardware.Storage.AbstractStorage), hardwareItem, "_storageInfo");
                        disk.Serial = obj.GetType().GetProperties().SingleOrDefaultF(e => e.Name == "Serial")?.GetValue(obj) as string;

                        var diskFromInfo = drives.SingleOrDefaultF(e => e.Name == letter);
                        if (diskFromInfo != null)
                        {
                            disk.Load.UsedSpaceBytes = diskFromInfo.TotalSize - diskFromInfo.TotalFreeSpace;
                            disk.Load.TotalFreeSpaceBytes = diskFromInfo.TotalFreeSpace;
                            disk.DriveType = diskFromInfo.DriveType;
                            disk.Label = diskFromInfo.VolumeLabel;
                            disk.Letter = letter.EndsWith("\\") ? letter[..^1] : letter;
                            disk.UniqueIdentifier = disk.Letter;
                        }

                        //var diskSession = CimSession.Create(null) // null instead of localhost which would otherwise require certain MMI services running
                        //.QueryInstances(@"root\cimv2", "WQL", "SELECT Model, Size, Manufacturer, Name, SerialNumber FROM Win32_DiskDrive");
                        //foreach (var queryObj in diskSession)
                        //{
                        //    //var ram = new RamData();

                        //    //ram.PartNumber = (string)Convert.ChangeType(queryObj.CimInstanceProperties["PartNumber"].Value, typeof(string));
                        //}
                        foreach (var sensor in hardwareItem.Sensors)
                        {
                            if (sensor.Value != null)
                                switch (sensor.SensorType)
                                {
                                    case SensorType.Data when sensor.Name == "Data Read":
                                        disk.Data.DataReadBytes = (ulong)(sensor.Value * 1e+9);
                                        break;
                                    case SensorType.Data when sensor.Name is "Data Written" or "Total Bytes Written":
                                        disk.Data.DataWrittenBytes = (ulong)(sensor.Value * 1e+9);
                                        break;

                                    case SensorType.Throughput when sensor.Name == "Read Rate":
                                        disk.Throughput.ReadRateBytesPerSecond = (long)sensor.Value;
                                        break;
                                    case SensorType.Throughput when sensor.Name == "Write Rate":
                                        disk.Throughput.WriteRateBytesPerSecond = (long)sensor.Value;
                                        break;

                                    case SensorType.Load when sensor.Name == "Used Space":
                                        disk.Load.UsedSpacePercentage = sensor.Value;
                                        break;
                                    case SensorType.Load when sensor.Name == "Write Activity":
                                        disk.Load.WriteActivityPercentage = sensor.Value;
                                        break;
                                    case SensorType.Load when sensor.Name == "Total Activity":
                                        disk.Load.TotalActivityPercentage = (float)Math.Round((float)sensor.Value, 2);
                                        break;

                                    case SensorType.Temperature:
                                        disk.Temperatures.Add(sensor.Name, (float)sensor.Value);
                                        break;
                                    default:
                                        break;
                                }
                        }

                        toReturn.Disks.TryAdd(hardwareItem.Name, disk);
                    }
                    diskUsagesData = toReturn;
                });
            }
            finally
            {
                IsUpdatingDiskUsage = false;
            }
        }

        /// <summary>
        /// Uses reflection to get the field value from an object.
        /// </summary>
        ///
        /// <param name="type">The instance type.</param>
        /// <param name="instance">The instance object.</param>
        /// <param name="fieldName">The field's name which is to be fetched.</param>
        ///
        /// <returns>The field value from the object.</returns>
        private static object GetInstanceField(Type type, object instance, string fieldName)
        {
            var bindFlags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic
                | BindingFlags.Static;
            var field = type.GetField(fieldName, bindFlags);
            return field.GetValue(instance);
        }

        private void AutoThrottle()
        {
            if (!ThrottleActive && DateTime.Now - lastServiceAccess > throttleAfter)
            {
                ThrottleActive = true;
                UpdateHardwareUsageDataTimer?.Change(Timeout.Infinite, 0);
                Log.Logger.Information($"{nameof(HardwarePerformanceService)} Throttler engaged. No queries recieved in the last {throttleAfter.TotalSeconds} seconds");
            }
            else if (ThrottleActive && DateTime.Now - lastServiceAccess < throttleAfter)
            {
                Log.Logger.Information($"{nameof(HardwarePerformanceService)} resuming to normal operation");
                ThrottleActive = false;
                UpdateHardwareUsageDataTimer?.Change(TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(2));
            }
        }

        private void UpdateRamUsage()
        {

            Utilities.Debug.LogExecutionTime(null, () =>
            {
                var searcher = new ManagementObjectSearcher("root\\CIMV2",
                   "SELECT FreePhysicalMemory, TotalVisibleMemorySize FROM Win32_OperatingSystem");

                var data = new RamUsageRaw();

                try
                {
                    foreach (ManagementObject queryObj in searcher.Get())
                    {
                        foreach (var propertyInfo in typeof(RamUsageRaw).GetProperties())
                        {
                            propertyInfo.SetValue(data, Convert.ChangeType(queryObj[propertyInfo.Name]?.ToString() ?? null, propertyInfo.PropertyType), null);
                        }
                    }
                }
                catch (Exception e)
                {
                    Log.Logger.Error(e.Message, e);
                }

                ramUsageData = new RamUsages
                {
                    UsedMemoryBytes = (data.TotalVisibleMemorySize - data.FreePhysicalMemory) * 1024,
                    TotalVisibleMemoryBytes = data.TotalVisibleMemorySize * 1024
                };
            });
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Log.Logger.Information($"{nameof(HardwarePerformanceService)} started");
            lastServiceAccess = DateTime.Now;
            AutoThrottlerTimer.Change(TimeSpan.FromSeconds(6), TimeSpan.FromSeconds(2));
            UpdateHardwareUsageDataTimer.Change(TimeSpan.Zero, TimeSpan.FromSeconds(2));
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            AutoThrottlerTimer?.Change(Timeout.Infinite, 0);
            UpdateHardwareUsageDataTimer?.Change(Timeout.Infinite, 0);
            computer.Close();
            Log.Logger.Information($"{nameof(HardwarePerformanceService)} is stopped.");
            return Task.CompletedTask;
        }

        private class UpdateVisitor : IVisitor
        {
            public void VisitComputer(IComputer computer)
            {
                computer.Traverse(this);
            }
            public void VisitHardware(IHardware hardware)
            {
                hardware.Update();
                foreach (IHardware subHardware in hardware.SubHardware) subHardware.Accept(this);
            }
            public void VisitSensor(ISensor sensor) { }
            public void VisitParameter(IParameter parameter) { }
        }
    }
}
