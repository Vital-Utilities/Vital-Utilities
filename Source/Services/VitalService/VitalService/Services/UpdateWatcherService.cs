using Microsoft.Extensions.Hosting;
using Microsoft.Toolkit.Uwp.Notifications;
using Octokit;
using Serilog;
using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace VitalService.Services
{
    public class UpdateWatcherService : IHostedService
    {
        private bool disposedValue;
        private Timer CheckForUpdateTimer { get; set; }
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public UpdateWatcherService() { }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        void NotifyNewVersion(Release release)
        {
            new ToastContentBuilder()
        .SetToastScenario(ToastScenario.Default)
        .AddArgument("action", "viewEvent")
        //.AddArgument("eventId", 1983)
        .AddText("New Release Available for Vital Utilities")
        .AddText($"Release Notes {release.Body}")
        .AddComboBox("snoozeTime", "15", ("15", "15 minutes"),
                                         ("60", "1 hour"),
                                         ("240", "4 hours"),
                                         ("1440", "1 day"),
                                         ("10080", "7 days"))
        .AddButton(new ToastButton()
            .SetSnoozeActivation("Open Download Page"))

        .AddButton(new ToastButton()
            .SetDismissActivation());
        }
        async Task CheckForUpdate()
        {
            const string owner = "Snazzie";
            const string repo = "Vital";
            var client = new GitHubClient(new ProductHeaderValue("Vital Utilities"));
            if (client is null)
            {
                Log.Logger.Error("Github Client is null");
                return;
            }
            var releases = await client.Repository.Release.GetAll("Snazzie", "Vital");

            if (releases == null || releases.Count == 0)
                Log.Logger.Warning($"No releases found in {owner}/{repo}");
            var latest = releases![0];

            var newVersionAvailable = new Version(latest.TagName) > Assembly.GetExecutingAssembly().GetName().Version;
            if (newVersionAvailable)
            {
                NotifyNewVersion(latest);
            }
        }
        public Task StartAsync(CancellationToken cancellationToken)
        {

            CheckForUpdateTimer = new Timer((_) => Task.Run(() => CheckForUpdate()), null, TimeSpan.FromSeconds(20), TimeSpan.FromHours(2));
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            CheckForUpdateTimer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        // // TODO: override finalizer only if 'Dispose(bool disposing)' has code to free unmanaged resources
        // ~UpdateWatcher()
        // {
        //     // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        //     Dispose(disposing: false);
        // }

    }
}
