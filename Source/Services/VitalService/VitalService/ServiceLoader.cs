using Microsoft.Extensions.DependencyInjection;
using System.Runtime.InteropServices;
using System.Text.Json.Serialization;
using System;
using VitalService.Services.PerformanceServices;
using VitalService.Services;
using VitalService.Stores;

namespace VitalService
{
    public static  class ServiceLoader
    {

        public static void LoadPlatformServices(this IServiceCollection services)
        {
            services.AddTransient<MachineDataStore>();

            services.AddSingleton<SoftwarePerformanceService>();
            services.AddHostedService(provider => provider.GetService<SoftwarePerformanceService>());
            services.AddTransient<ProfileStore>();

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                services.AddTransient<IManagedProcessStore, ManagedProcessStoreWindows>();
                services.AddSingleton<HardwarePerformanceService>(new HardwarePerformanceServiceWindows());

                services.AddSingleton<ConfigApplyerServiceWindows>();
                services.AddHostedService(provider => provider.GetService<ConfigApplyerServiceWindows>());
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                services.AddTransient<IManagedProcessStore, ManagedProcessStoreMac>();
                services.AddSingleton<HardwarePerformanceService>(new HardwarePerformanceServiceMac());
            }
            else
                throw new ArgumentOutOfRangeException("OS not supported");

            services.AddHostedService(provider => provider.GetService<HardwarePerformanceService>());

            services.AddSingleton<MetricsStorageService>();
            services.AddHostedService(provider => provider.GetService<MetricsStorageService>());


            services.AddSignalR().AddJsonProtocol(options =>
            {
                options.PayloadSerializerOptions.Converters
                   .Add(new JsonStringEnumConverter());
            });
        }
    }
}
