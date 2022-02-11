using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace VitalService.Services.SignalR
{
    public class SystemStatsHub : Hub
    {

        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }

}
