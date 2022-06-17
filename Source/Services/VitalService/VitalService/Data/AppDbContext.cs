using Microsoft.EntityFrameworkCore;
using System;
using VitalService.Data.App;
using VitalService.Dtos;

namespace VitalService.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<ManagedModel> ManagedProcesses { get; set; }

        public DbSet<ProfileModel> Profiles { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            //optionsBuilder.LogTo(Log.Logger.Information);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder
                .Entity<ManagedModel>()
                .Property(e => e.ProcessPriority)
                .HasConversion(
                    v => v.ToString(),
                    v => (ProcessPriorityEnum)Enum.Parse(typeof(ProcessPriorityEnum), v))
                .HasDefaultValue(ProcessPriorityEnum.DontOverride);

            modelBuilder.Entity<ProfileModel>().HasIndex(e => e.Name).IsUnique();
            modelBuilder.Entity<ProfileModel>()
                .HasMany(e => e.ManagedModels)
                .WithOne(e => e.ProfileModel)
                .HasForeignKey(e => e.ParentProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}