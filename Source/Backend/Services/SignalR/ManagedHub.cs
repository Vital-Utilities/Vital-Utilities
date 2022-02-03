using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using VitalService.Dtos;

namespace VitalService.Services.SignalR
{

    public class ManagedHub : Hub
    {
        public const string HubName = nameof(ManagedHub);
        public const string ManagedAdded = "ManagedAdded";
        public const string ManagedUpdated = "ManagedUpdated";
        public const string ManagedRemoved = "ManagedRemoved";
    }
    public class AppSettingsHub : Hub
    {
        public const string HubName = nameof(AppSettingsHub);
        public const string SettingsChanged = "SettingsChanged";

    }

    public static class AffinityHubExtensions
    {
        public static async Task SendSettingsChanged(this IClientProxy clientProxy, SettingsDto dto)
        {
            await clientProxy.SendAsync(AppSettingsHub.SettingsChanged, dto);
        }

        public static async Task SendManagedAdded(this IClientProxy clientProxy, ManagedModelDto dto)
        {
            await clientProxy.SendAsync(ManagedHub.ManagedAdded, dto);
        }
        public static async Task SendManagedUpdated(this IClientProxy clientProxy, ManagedModelDto dto)
        {
            await clientProxy.SendAsync(ManagedHub.ManagedUpdated, dto);
        }
        public static async Task SendManagedRemoved(this IClientProxy clientProxy, ManagedModelDto dto)
        {
            await clientProxy.SendAsync(ManagedHub.ManagedRemoved, dto);
        }
    }

}
