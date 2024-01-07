using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Versioning;
using System.Threading.Tasks;
using VitalService.Data;
using VitalService.Data.App;
using VitalService.Services.SignalR;

namespace VitalService.Stores
{
    [SupportedOSPlatform("windows")]
    public class ManagedProcessStoreWindows: IManagedProcessStore
    {
        private IDbContextFactory<AppDbContext> DbContextFactory { get; }
        public IHubContext<ManagedHub> HubContext { get; }

        public ManagedProcessStoreWindows(IDbContextFactory<AppDbContext> dbContextFactory, IHubContext<ManagedHub> hubContext)
        {
            DbContextFactory = dbContextFactory;
            HubContext = hubContext;
        }

        public async Task<ManagedModel[]> GetAsync()
        {
            using var context = DbContextFactory.CreateDbContext();
            var models = await context.ManagedProcesses.Include(model => model.ProfileModel).ToArrayAsync();
            return models;
        }
        public async Task<ManagedModel[]> GetAsync(IEnumerable<int> ids)
        {
            using var context = DbContextFactory.CreateDbContext();
            var arr = ids.ToArray();
            return await context.ManagedProcesses.Include(model => model.ProfileModel).Where(e => arr.Contains(e.Id)).ToArrayAsync();
        }
        public async Task<ManagedModel?> GetAsync(string name)
        {
            using var context = DbContextFactory.CreateDbContext(); ;
            return await context.ManagedProcesses.Include(model => model.ProfileModel).SingleOrDefaultAsync(e => e.ProcessName == name);
        }

        public async Task<ManagedModel?> GetAsync(int id)
        {
            using var context = DbContextFactory.CreateDbContext();
            return await context.ManagedProcesses.Include(model => model.ProfileModel).SingleOrDefaultAsync(e => e.Id == id);
        }

        public async Task RemoveAsync(ManagedModel model)
        {
            using var context = DbContextFactory.CreateDbContext();

            context.ManagedProcesses.Remove(model);
            await context.SaveChangesAsync();
            await HubContext.Clients.All.SendManagedRemoved(model.ToDto());
        }

        public async Task RemoveAsync(int id)
        {
            using var context = DbContextFactory.CreateDbContext();
            var model = await context.ManagedProcesses.SingleOrDefaultAsync(e => e.Id == id);
            if (model != null)
            {
                context.ManagedProcesses.Remove(model);
                await context.SaveChangesAsync();
                await HubContext.Clients.All.SendManagedRemoved(model.ToDto());
            }
        }
    }
}
