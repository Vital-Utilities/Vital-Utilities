using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Sinks.SystemConsole.Themes;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using VitalService.Data;
using VitalService.Stores;

namespace VitalService
{
    public class Program
    {
        public static string ExePath => Path.Combine(AppDomain.CurrentDomain.BaseDirectory + $"{AppDomain.CurrentDomain.FriendlyName}.exe");
        public static readonly string appDir = AppDomain.CurrentDomain.BaseDirectory;
        public static readonly string appAliasWithoutSpace = "VitalUtilities";
        public static readonly string appAliasWithSpace = "Vital Utilities";
        public static readonly string appDocumentsDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), appAliasWithSpace);
#if DEBUG == false
        public static readonly string rustServiceExe = Path.Combine(appDir, "../VitalRustService/VitalRustService.exe");

#endif

        static readonly IConfigurationRoot appSettings = new ConfigurationBuilder().SetBasePath(appDir)


#if DEBUG == false
                .AddJsonFile(Path.Combine(appDir, "appsettings.json"), false, true)
#else
                .AddJsonFile(Path.Combine(appDir, "appsettings.development.json"), false, true)
#endif
                .Build();
        public static void Main(string[] args)
        {

            Log.Logger = new LoggerConfiguration()
                            .ReadFrom.Configuration(appSettings)
                            .Enrich.FromLogContext()
                            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}", theme: AnsiConsoleTheme.Code)
                            .WriteTo.File(Path.Combine(appDir, "Logs\\log.txt"), rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)

                .CreateLogger();

            Process.GetCurrentProcess().PriorityClass = ProcessPriorityClass.BelowNormal;
            // get path to windows programdata folder

            string mutexName = $@"Global\{AppDomain.CurrentDomain.FriendlyName}";

            _ = new Mutex(true, mutexName, out var createdNew);

            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;

            if (!createdNew)
            {
                Log.Logger.Warning(mutexName + " is already running! Exiting the application.");
                return;
            }



#if DEBUG == false

            foreach (var process in Process.GetProcessesByName("VitalRustService"))
            {
                Log.Logger.Information($"Running VitalRustService found! killing process {process.Id}.");
                process.Kill();
            }
            Log.Logger.Information($"Starting VitalRustService");
            Process.Start(rustServiceExe);
#endif

            var host = CreateHostBuilder(args).Build();
            using (var scope = host.Services.CreateScope())
            {
                scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
                scope.ServiceProvider.GetRequiredService<MetricDbContext>().Database.Migrate();
            }
            host.Run();
        }

        static void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            // Log the exception, display it, etc
            Log.Logger.Error(e.ExceptionObject as Exception, "Unhandled Exception!");

        }

        public static IHostBuilder CreateHostBuilder(string[] args)
        {
            var builder = Host.CreateDefaultBuilder(args);
            builder
             .ConfigureAppConfiguration(e =>
             {
                 e.AddConfiguration(appSettings);
             })
             .ConfigureWebHostDefaults(webBuilder =>
             {
                 var settings = new SettingsStore().Settings;
                 Log.Logger.Information("{@settings}", settings);
                 webBuilder.UseUrls(new[] { $"http://*:{settings.Launch.VitalServiceHttpPort}" });
#if !DEBUG
                 try
                 {
                     webBuilder.UseSentry(o =>
                     {
                         o.Dsn = "REPLACE_WITH_SENTRYIO_BACKEND_DSN";
                         // When configuring for the first time, to see what the SDK is doing:
                         o.Debug = false;
                         o.AttachStacktrace = true;
                         // Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring.
                         // We recommend adjusting this value in production.
                         //o.TracesSampleRate = 1.0;
                     });
                 }
                 catch (Exception e) { Log.Logger.Error("", e); }
#endif
                 webBuilder.UseStartup<Startup>();
             });

            return builder;
        }
    }
}