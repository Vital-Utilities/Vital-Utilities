
task InstallService {
    New-Service -Name "VitalService" -StartupType "Automatic" -ErrorAction "Stop" -BinaryPathName ./bin/VitalService.exe
}

// start windows service
task StartService {
    Start-Service -Name "VitalService" -ErrorAction "Stop"
}