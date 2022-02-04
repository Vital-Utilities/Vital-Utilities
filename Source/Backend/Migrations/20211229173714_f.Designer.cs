﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using VitalService.Data;

#nullable disable

namespace VitalService.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20211229173714_f")]
    partial class f
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "6.0.0");

            modelBuilder.Entity("VitalService.Data.App.ManagedModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("AffinityBinary")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("Alias")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("ExecutionPath")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int>("ParentProfileId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("ProcessName")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("ProcessPriority")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT")
                        .HasDefaultValue("DontOverride");

                    b.HasKey("Id");

                    b.HasIndex("ParentProfileId");

                    b.ToTable("ManagedProcesses");
                });

            modelBuilder.Entity("VitalService.Data.App.ProfileModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<bool>("Enabled")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int?>("Priority")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.ToTable("Profiles");
                });

            modelBuilder.Entity("VitalService.Data.App.ManagedModel", b =>
                {
                    b.HasOne("VitalService.Data.App.ProfileModel", "ProfileModel")
                        .WithMany("ManagedModels")
                        .HasForeignKey("ParentProfileId")
                        .OnDelete(DeleteBehavior.NoAction)
                        .IsRequired();

                    b.Navigation("ProfileModel");
                });

            modelBuilder.Entity("VitalService.Data.App.ProfileModel", b =>
                {
                    b.Navigation("ManagedModels");
                });
#pragma warning restore 612, 618
        }
    }
}
