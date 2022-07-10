using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using VitalService.Data;
using VitalService.Dtos;
using VitalService.Services;
using VitalService.Services.PerformanceServices;
using VitalService.Services.SignalR;
using VitalService.Stores;

namespace VitalService
{
    public class Startup
    {
        readonly SettingsStore settingsStore;
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
            settingsStore = new SettingsStore();
        }


        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var path = Program.appDocumentsDir;
            var appDbCs = Configuration.GetConnectionString("AppDbConnection").Replace("|DataDirectory|", path + "\\");
            services.AddDbContextFactory<AppDbContext>(e => e.UseSqlite(appDbCs).EnableServiceProviderCaching(false));

            var metricDbCs = Configuration.GetConnectionString("MetricDbConnection").Replace("|DataDirectory|", path + "\\");
            services.AddDbContextFactory<MetricDbContext>(e => e.UseSqlite(metricDbCs).EnableServiceProviderCaching(false));

            services.AddSingleton(settingsStore);
            services.AddTransient<ManagedProcessStore>();
            services.AddTransient<ProfileStore>();
            services.AddTransient<MachineDataStore>();

            services.AddSingleton<SoftwarePerformanceService>();
            services.AddHostedService(provider => provider.GetService<SoftwarePerformanceService>());

            services.AddSingleton<HardwarePerformanceService>();
            services.AddHostedService(provider => provider.GetService<HardwarePerformanceService>());

            services.AddSingleton<MetricsStorageService>();
            services.AddHostedService(provider => provider.GetService<MetricsStorageService>());

            services.AddSingleton<ConfigApplyerService>();
            services.AddHostedService(provider => provider.GetService<ConfigApplyerService>());

            services.AddHostedService<UpdateWatcherService>();

            if (settingsStore.Settings.InfluxDb.Enabled)
                services.AddHostedService<InfluxDbInterfacingService>();

            services.AddSignalR().AddJsonProtocol(options =>
            {
                options.PayloadSerializerOptions.Converters
                   .Add(new JsonStringEnumConverter());
            });
            services.AddSwaggerGen(options =>
            {

                options.SchemaFilter<SwaggerRequiredSchemaFilter>();
                options.SupportNonNullableReferenceTypes();
               // options.UseAllOfToExtendReferenceSchemas(); // Allows $ref enums to be nullable
                options.UseAllOfForInheritance();  // Allows $ref objects to be nullable
            });

            services.AddResponseCompression();
            services.AddControllers().AddJsonOptions(opts =>
            {
                opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

            services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                policy.AllowAnyHeader()
                        .AllowAnyMethod()
                        .SetIsOriginAllowed(_ => true)
                        .AllowCredentials());
            });

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            app.Use(async (context, next) =>
            {
                if (!context.Request.IsLocalRequest())
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.Body = new MemoryStream(Encoding.UTF8.GetBytes("Only Local Requests are allowed" ?? ""));

                    return;
                }

                await next.Invoke();
            });


            app.UseCors();
            //app.UseHttpsRedirection();

            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHub<ManagedHub>(ManagedHub.HubName);
            });
        }
    }
}
internal static class HttpHelper
{
    public static bool IsLocalRequest(this HttpRequest req)
    {
        var connection = req.HttpContext.Connection;
        if (connection.RemoteIpAddress != null)
        {
            return IPAddress.IsLoopback(connection.RemoteIpAddress);
        }

        // for in memory TestServer or when dealing with default connection info
        if (connection.RemoteIpAddress == null && connection.LocalIpAddress == null)
        {
            return true;
        }

        return false;
    }

}
