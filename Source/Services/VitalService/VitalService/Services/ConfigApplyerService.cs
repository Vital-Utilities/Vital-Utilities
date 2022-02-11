
using Microsoft.Extensions.Hosting;
using Serilog;
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VitalService.Data.App;
using VitalService.Stores;
using VitalService.Utilities;

namespace VitalService.Services
{
    public class ConfigApplyerService : IHostedService
    {
        private ProfileStore Store { get; }
        private Timer ApplyerTimer { get; set; }
        public ConfigApplyerService(ProfileStore store)
        {
            Store = store ?? throw new ArgumentNullException(nameof(store));
            ApplyerTimer = new Timer((_) => ApplyConfig(), null, Timeout.Infinite, Timeout.Infinite);
        }

        private static void Apply(ProfileModel[] profiles)
        {
            Utilities.Debug.LogExecutionTime(null, () =>
            {

                var processes = Process.GetProcesses();
                foreach (var profile in profiles.Where(e => e.Enabled))
                {

                    var proccessesToApply = profile.ManagedModels.Select(e => (model: e, processes: processes.Where(p => p.ProcessName == e.ProcessName)));


                    foreach (var tupal in proccessesToApply)
                    {
                        var affinityToApply = Affinity.BinaryToIntPtr(tupal.model.AffinityBinary);
                        foreach (var process in tupal.processes)
                        {
                            try
                            {
                                if (affinityToApply != process.ProcessorAffinity)
                                {
                                    process.ProcessorAffinity = affinityToApply;
                                    Log.Logger.Information($"{process.ProcessName} | pid: {process.Id} affinity was set to ({Utilities.Affinity.IntArrayToBinaryString(Utilities.Affinity.IntPtrToBinary(affinityToApply))})");
                                }

                                var priority = tupal.model.ProcessPriority.ToWindowsObject();
                                if (priority != null && priority.Value != process.PriorityClass)
                                {
                                    process.PriorityClass = priority.Value;
                                    Log.Logger.Information($"{process.ProcessName} | pid: {process.Id} priority was set to ({Enum.GetName(typeof(ProcessPriorityClass), priority.Value)})", process.ProcessName);
                                }
                            }
                            catch (Win32Exception exception) when (exception.Message == "Access is denied.")
                            {
                                Log.ForContext<ConfigApplyerService>().Warning(exception, $"Could not set affinity for {process.ProcessName} | pid: {process.Id}. This is probably due to {AppDomain.CurrentDomain.FriendlyName} not having administrator priviledges.");
                            }
                            catch (Exception e)
                            {
                                Log.ForContext<ConfigApplyerService>().Error(e, "Something went wrong");
                            }
                        }

                    }
                }
            });

        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Log.Logger.Information($"AffinityApplyer Service started");
            ApplyerTimer.Change(TimeSpan.Zero, TimeSpan.FromSeconds(10));
            return Task.CompletedTask;
        }

        private void ApplyConfig()
        {
            Apply(Store.GetAllAsync().Result);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            Log.Logger.Information("AffinityApplyer Service is stopping.");

            ApplyerTimer?.Change(Timeout.Infinite, 0);
            Log.Logger.Information("AffinityApplyer Service is stopped.");
            return Task.CompletedTask;
        }

    }
}