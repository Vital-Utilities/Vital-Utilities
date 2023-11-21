using JM.LinqFaster;
using LibreHardwareMonitor.Hardware;
using Microsoft.Extensions.Hosting;
using Microsoft.Management.Infrastructure;
using Namotion.Reflection;
using Serilog;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Versioning;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using VitalRustServiceClasses;
using VitalService.Dtos.Coms;
using VitalService.Dtos.Data;

namespace VitalService.Services.PerformanceServices
{
    [SupportedOSPlatform("windows")]
    public class HardwarePerformanceServiceWindows : HardwarePerformanceService
    {

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

        public HardwarePerformanceServiceWindows() : base()
        {
            computer.Open();
            UpdateUpdateVisitor = () => { computer.Accept(updateVisitor); };
            SetStaticData();
        }

        private void SetStaticData()
        {
            computer.Accept(new UpdateVisitor());
            var data = new GetMachineStaticDataResponse();

            foreach (var hardwareItem in computer.Hardware)
            {
                if (hardwareItem.HardwareType == HardwareType.GpuNvidia || hardwareItem.HardwareType == HardwareType.GpuAmd || hardwareItem.HardwareType == HardwareType.GpuIntel)
                {

                    var memoryTotal = hardwareItem.Sensors.FirstOrDefault(x => x.Name == "GPU Memory Total")?.Value;
                    var gpu = new GpuData
                    {
                        Name = hardwareItem.Name.Trim(),
                        MemoryTotalBytes = (long?)memoryTotal
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
                }
            }
            var cacheData = GetCpuCacheData();
            data.Cpu.L1CacheSize = cacheData.L1Size ?? 0;
            data.Cpu.L2CacheSize = cacheData.L2Size ?? 0;
            data.Cpu.L3CacheSize = cacheData.L3Size ?? 0;
            data.Ram = GetStaticRamData().ToList();

            MachineStaticData = data;
        }

        private static CpuCache GetCpuCacheData()
        {
            var session = CimSession.Create(null) // null instead of localhost which would otherwise require certain MMI services running
                                            .QueryInstances(@"root\cimv2", "WQL", $"SELECT DeviceId, MaxCacheSize FROM Win32_CacheMemory");
            var cache = new CpuCache();
            foreach (var queryObj in session)
            {
                var val = (ulong)Convert.ChangeType(queryObj.CimInstanceProperties["MaxCacheSize"].Value ?? "", typeof(ulong));
                switch (queryObj.CimInstanceProperties["DeviceId"].Value)
                {
                    case "Cache Memory 0":
                        cache.L1Size = val;
                        break;
                    case "Cache Memory 1":
                        cache.L2Size = val;
                        break;
                    case "Cache Memory 2":
                        cache.L3Size = val;
                        break;
                    default:
                        Log.Logger.Error("more than three cpu cache was found");
                        break;
                }
            }
            return cache;
        }

        static IEnumerable<RamData> GetStaticRamData()
        {
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

                if (queryObj.CimInstanceProperties["DeviceLocator"].Value is string slotName)
                {
                    var rgx = new Regex(@"/\d +$/");
                    var split = rgx.Match(slotName);
                    int? slotNumber = null;
                    if (split.Success) slotNumber = int.Parse(split.Value);
                    ram.SlotNumber = slotNumber;
                }

                ram.SlotChannel = (string?)Convert.ChangeType(queryObj.CimInstanceProperties["BankLabel"].Value, typeof(string));

                yield return ram;
            }
        }

        internal override void UpdateNetworkUsage()
        {
            if (IsUpdatingNetworkUsage || networkDataFromRust is null)
                return;
            IsUpdatingNetworkUsage = true;
            try
            {
                var toReturn = new NetworkAdapterUsages();

                if (networkDataFromRust is not null)
                {
                    foreach (var adapter in networkDataFromRust)
                    {

                        toReturn.Adapters.TryAdd(adapter.Properties.Name, adapter);
                    }
                }
                networkUsageData = toReturn;
            }
            finally
            {
                IsUpdatingNetworkUsage = false;
            }

        }

        internal override void UpdateGpuUsage()
        {

            var toReturn = new List<GpuUsage>();

            if (gpuDataFromRust != null)
                toReturn.AddRange(gpuDataFromRust);

            var devices = computer.Hardware.Where(e => e.HardwareType is HardwareType.GpuNvidia or HardwareType.GpuAmd or HardwareType.GpuIntel).ToArray();
            for (int i = 0; i < devices.Length; i++)
            {
                var hardwareItem = devices[i];
                if (hardwareItem.HardwareType == HardwareType.GpuNvidia)
                    continue; // we use nvml in rust to get nvidia gpu data

                var gpu = new GpuUsage();
                gpu.DeviceIndex = i;
                gpu.Name = hardwareItem.Name.Trim();

                foreach (var sensor in hardwareItem.Sensors)
                {
                    if (sensor.Value is null)
                        continue;

                    switch (sensor.SensorType)
                    {
                        case SensorType.Temperature:
                            {
                                var value = MathF.Round((float)sensor.Value, 2);

                                if (sensor.Name == "GPU Core")
                                    gpu.TemperatureReadings.AddOrUpdate("GPU Core", (float)value, (key, oldValue) => oldValue = (float)value);
                                else
                                    gpu.TemperatureReadings.AddOrUpdate(sensor.Name, (float)value, (key, oldValue) => oldValue = (float)value);
                                break;
                            }
                        case SensorType.Load:
                            {
                                if (gpu.Load is null)
                                    gpu.Load = new();
                                var value = MathF.Round((float)sensor.Value, 2);

                                switch (sensor.Name)
                                {
                                    case "GPU Core":
                                        gpu.Load.CorePercentage = value;
                                        break;
                                    case "GPU Frame Buffer":
                                        gpu.Load.FrameBufferPercentage = value;
                                        break;
                                    case "GPU Video Engine":
                                        gpu.Load.VideoEnginePercentage = value;
                                        break;
                                    case "GPU Bus":
                                        gpu.Load.BusInterfacePercentage = value;
                                        break;
                                    case "GPU Memory":
                                        gpu.Load.MemoryUsedPercentage = value;
                                        break;
                                    case "GPU Memory Controller":
                                        gpu.Load.MemoryControllerPercentage = value;
                                        break;
                                    case "D3D Cuda":
                                        gpu.Load.CudaPercentage = value;
                                        break;
                                    case "D3D 3D":
                                        gpu.Load.ThreeDPercentage = value;
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            }
                        case SensorType.Clock:
                            {
                                var value = sensor.Value;
                                if (gpu.ClockSpeeds is null)
                                    gpu.ClockSpeeds = new();

                                switch (sensor.Name)
                                {
                                    case "GPU Core":
                                        gpu.ClockSpeeds.GraphicsClockMhz = (int)value;
                                        break;
                                    case "GPU Memory":
                                        gpu.ClockSpeeds.MemoryClockMhz = (int)value;
                                        break;
                                    case "GPU Shader":
                                        gpu.ClockSpeeds.ComputeClockMhz = (int)value;
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
                                    _ = gpu.FanPercentage?.TryAdd(sensor.Name, MathF.Round((float)sensor.Value, 2));
                                }
                                break;
                            }
                        case SensorType.SmallData:
                            {
                                var value = sensor.Value * 1024 * 1024;
                                switch (sensor.Name)
                                {
                                    case "GPU Memory Used":
                                        gpu.MemoryUsedBytes = (long)value;
                                        break;
                                    case "GPU Memory Total":
                                        gpu.TotalMemoryBytes = (long)value;
                                        break;
                                }
                                break;
                            }
                        case SensorType.Power:
                            {

                                gpu.PowerDrawWatt = (int)sensor.Value;
                                break;
                            }

                        case SensorType.Throughput:
                            {
                                var value = (long)sensor.Value;
                                switch (sensor.Name)
                                {
                                    case "GPU PCIe Rx":
                                        gpu.PCIe.PCIe_RxBytesPerSecond = value;
                                        break;
                                    case "GPU PCIe Tx":
                                        gpu.PCIe.PCIe_TxBytesPerSecond = value;
                                        break;

                                    default:
                                        var exeption = new NotImplementedException($"{sensor.Name} is not handled");
                                        Log.Logger.Error(exeption, "Unhandled GPU Throughput Data");
                                        break;
                                }
                                break;
                            }

                    }
                    toReturn.Add(gpu);
                }

                gpuUsageData = toReturn;
            }
        }
        internal override void UpdateCpuUsage()
        {
            if (IsUpdatingCpuUsage)
                return;
            IsUpdatingCpuUsage = true;
            try
            {
                var toReturn = new CpuUsage();

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
                                        toReturn.TemperatureReadings.TryAdd("CPU Package", MathF.Round((float)sensor.Value, 2));
                                    else
                                        toReturn.TemperatureReadings.TryAdd(sensor.Name, MathF.Round((float)sensor.Value, 2));
                                break;
                            case SensorType.Power:
                                if (sensor.Value != null && sensor.Name == "Package" && sensor.Value != null)
                                    toReturn.PowerDrawWattage = MathF.Round((float)sensor.Value, 2);
                                break;
                        }
                    }
                }
                if (cpuDataFromRust is not null)
                {
                    toReturn.CoreClocksMhz = cpuDataFromRust.CoreClocksMhz;
                    toReturn.TotalCorePercentage = MathF.Round(cpuDataFromRust.TotalCorePercentage);
                    toReturn.CorePercentages = cpuDataFromRust.CorePercentages.Select(e => MathF.Round(e)).ToList();
                }
                cpuUsageData = toReturn;
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

        internal override void UpdateDiskUsage()
        {
            if (IsUpdatingDiskUsage || diskUsageDataFromRust is null)
                return;
            IsUpdatingDiskUsage = true;

            try
            {
                var toReturn = new DiskUsages();

                var libreDisks = computer.Hardware.Where(e => e.HardwareType == HardwareType.Storage).ToArray();
                var drives = DriveInfo.GetDrives();
                foreach ((var key, var disk) in diskUsageDataFromRust)
                {
                    var hardwareItem = libreDisks.Single(e => e.TryGetPropertyValue<DriveInfo[]>("DriveInfos", null)?[0].Name == disk.Name);
                    var obj = GetInstanceField(typeof(LibreHardwareMonitor.Hardware.Storage.AbstractStorage), hardwareItem, "_storageInfo");
                    var diskFromInfo = drives.SingleOrDefaultF(e => e.Name == disk.Letter);
                    var usage = new DiskUsage
                    {
                        Name = diskFromInfo.VolumeLabel,
                        Letter = disk.Letter,
                        DriveType = diskFromInfo.DriveType,
                        DiskType = disk.DiskType,
                        DiskHealth = new(),
                        Load = disk.Load,
                        Serial = obj.GetType().GetProperties().SingleOrDefaultF(e => e.Name == "Serial")?.GetValue(obj) as string,
                        Temperatures = disk.Temperatures,
                        Throughput = disk.Throughput,
                        UniqueIdentifier = disk.Letter,
                        VolumeLabel = diskFromInfo.VolumeLabel
                    };

                    foreach (var sensor in hardwareItem.Sensors)
                    {
                        if (sensor.Value is null)
                            continue;

                        if (disk.DiskHealth is null)
                            disk.DiskHealth = new();
                        if (disk.Throughput is null)
                            disk.Throughput = new();

                        switch (sensor.SensorType)
                        {
                            case SensorType.Data when sensor.Name == "Data Read":
                                disk.DiskHealth.TotalBytesRead = (ulong)(sensor.Value * 1e+9);
                                break;
                            case SensorType.Data when sensor.Name is "Data Written" or "Total Bytes Written":
                                disk.DiskHealth.TotalBytesWritten = (ulong)(sensor.Value * 1e+9);
                                break;

                            case SensorType.Throughput when sensor.Name == "Read Rate":
                                disk.Throughput.ReadRateBytesPerSecond = (long)sensor.Value;
                                break;
                            case SensorType.Throughput when sensor.Name == "Write Rate":
                                disk.Throughput.WriteRateBytesPerSecond = (long)sensor.Value;
                                break;

                            case SensorType.Load when sensor.Name == "Write Activity":
                                disk.Load.WriteActivityPercentage = MathF.Round((float)sensor.Value, 2);
                                break;
                            case SensorType.Load when sensor.Name == "Total Activity":
                                disk.Load.TotalActivityPercentage = MathF.Round((float)sensor.Value, 2);
                                break;

                            case SensorType.Temperature:
                                disk.Temperatures[sensor.Name] = (float)sensor.Value;
                                break;
                            default:
                                break;
                        }
                    }

                    toReturn.Disks.TryAdd(hardwareItem.Name, disk);
                }

                diskUsagesData = toReturn;
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

        internal override void UpdateRamUsage()
        {

            if (memDataFromRust is null)
                return;

            ramUsageData = new MemoryUsage
            {
                UsedMemoryBytes = memDataFromRust.UsedMemoryBytes,
                TotalVisibleMemoryBytes = memDataFromRust.TotalVisibleMemoryBytes
            };
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
