using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using VitalService.Data;
using VitalService.Data.App;
using VitalService.Services.SignalR;

namespace VitalService.Stores
{
    public class ProfileStore
    {

        private IDbContextFactory<AppDbContext> DbContextFactory { get; }
        public IHubContext<ManagedHub> HubContext { get; }
        public ProfileStore(IDbContextFactory<AppDbContext> dbContextFactory, IHubContext<ManagedHub> hubContext)
        {
            DbContextFactory = dbContextFactory;
            HubContext = hubContext;
        }

        public async Task<ProfileModel?> GetAsync(int id)
        {
            using var context = DbContextFactory.CreateDbContext();
            return await context.Profiles.Include(e => e.ManagedModels).SingleOrDefaultAsync(e => e.Id == id);
        }

        public async Task<ProfileModel[]> GetAllAsync()
        {
            using var context = DbContextFactory.CreateDbContext();
            return await context.Profiles.Include(e => e.ManagedModels).ToArrayAsync();
        }

        public async Task UpdateAsync(ProfileModel model)
        {
            using var context = DbContextFactory.CreateDbContext();
            context.Profiles.Update(model);
            await context.SaveChangesAsync();
        }

        public async Task<ProfileModel> Create(ProfileModel model)
        {
            using var context = DbContextFactory.CreateDbContext();
            await context.Profiles.AddAsync(model);

            await context.SaveChangesAsync();
            return model;
        }

        public async Task DeleteAsync(ProfileModel model)
        {
            using var context = DbContextFactory.CreateDbContext();

            context.Profiles.Remove(model);

            await context.SaveChangesAsync();
        }
    }
}
