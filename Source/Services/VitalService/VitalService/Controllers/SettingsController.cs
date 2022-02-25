using Microsoft.AspNetCore.Mvc;
using VitalService.Dtos;
using VitalService.Stores;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

namespace VitalService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        public SettingsStore SettingsStore { get; }

        public SettingsController(SettingsStore settingsStore)
        {
            SettingsStore = settingsStore;
        }


        [HttpGet]
        public SettingsDto Get()
        {
            return new SettingsDto()
            {
                RunAtStarup = SettingsStore.Settings.RunAtStarup,
            };
        }

        [HttpPut("SetRunAtStartup")]
        public void SetRunAtStartup([FromQuery] bool runAtStartup)
        {
            SetTaskScheduler(runAtStartup);
            var settings = SettingsStore.Settings;
            settings.RunAtStarup = runAtStartup;
            SettingsStore.UpdateSettings(settings);
        }

        private void SetTaskScheduler(bool runAtStartup)
        {

            var taskFolderName = Program.appAliasWithSpace;
            string argument = runAtStartup
                ? $"Register-ScheduledTask VitalService '{taskFolderName}' -Action (New-ScheduledTaskAction -Execute '{Program.ExePath}') -Principal (New-ScheduledTaskPrincipal -UserId (Get-CimInstance –ClassName Win32_ComputerSystem | Select-Object -expand UserName) -RunLevel Highest) -Trigger (New-ScheduledTaskTrigger -AtLogon -User (Get-CimInstance –ClassName Win32_ComputerSystem | Select-Object -expand UserName)) -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries)"
                : $@"
Unregister-ScheduledTask -TaskPath '\{taskFolderName}\' -TaskName VitalService -Confirm:$false;
$scheduleObject = New-Object -ComObject Schedule.Service;
$scheduleObject.connect();
$rootFolder = $scheduleObject.GetFolder('{taskFolderName}');
$rootFolder.DeleteFolder('',$null)";

            var startInfo = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = argument,
                Verb = "runas",
                UseShellExecute = true,
                CreateNoWindow = false
            };
            var process = new Process
            {
                StartInfo = startInfo
            };
            process.Start();
        }


    }
}
