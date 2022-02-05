<p align="center">
<img height="200" src="Source/Assets/Vital-large.png"/>
</p>
<p align="center">

<img src="https://img.shields.io/github/v/release/Vital-Utilities/Vital-Utilities?style=flat-square"/>
<a href="https://discord.gg/ghQ8nQK2ma"><img src="https://img.shields.io/discord/753338394481787070?label=Discord"/></a>
<br/>
<img src="https://github.com/Vital-Utilities/Vital-Utilities/actions/workflows/vital-service-tests.yml/badge.svg?branch=master"/>
<img src="https://github.com/Vital-Utilities/Vital-Utilities/actions/workflows/test_webapp.yml/badge.svg?branch=master"/>
<br/>
🌟🌠✨⭐Show your support by hitting that Star, share and talk about this app ⭐✨🌠🌟

</p>

- [Links](#links)
- [License](#license)
- [Notice](#notice)
- [Tech Stack](#tech-stack)
- [Looking for help](#looking-for-help)
- [Platform / Support Focus](#platform--support-focus)
- [What is Vital](#what-is-vital)
- [Why use Vital?](#why-use-vital)
- [How to get the most out of Vital's Profiles?](#how-to-get-the-most-out-of-vitals-profiles)
- [Vital's current limitations](#vitals-current-limitations)
- [Running Vital Service with admin priviledges](#running-vital-service-with-admin-priviledges)
- [Auto start Vital Service on log in](#auto-start-vital-service-on-log-in)
- [Things being worked on](#things-being-worked-on)
  - [V1](#v1)
  - [Distant Future Goals](#distant-future-goals)
- [Screenshots](#screenshots)

## Links

Feature requests and questions >> [Discussion](https://github.com/Vital-Utilities/Vital-Utilities/discussions)

Report a bug >> [Issues](https://github.com/Vital-Utilities/Vital-Utilities/issues)

[Discord Server](https://discord.gg/ghQ8nQK2ma)

## License

[Vital License v1.0](./LICENSE)

| Permissions     | Limitations      |
| --------------- | ---------------- |
| ✅ Private use  | ❌Commercial use |
| ✅ Modification | ❌Liability      |
|                 | ❌Warranty       |
|                 | ❌Distribution   |
|                 | ❌Patent use     |

## Notice

- Always download installers from [The Official Download Location](https://github.com/Vital-Utilities/Vital-Utilities/releases) to avoid tampered code from malicious people.
- The state of this project is very much in alpha stage.
- Bugs exists. UI and features are missing and are subject to change throughout its development.

## Tech Stack

See [Readme in ./Source](./Source/readme.md)

## Looking for help

Please get in contact with Snazzie if you're interested in helping with anything below.

- Looking for someone who has experience with Wix toolkit to complete the installer
- Looking for someone who has experience with AMD and NVIDIA SDK to grab cpu and gpu data
  - To get process FPS and GPU usage
  - To get AMD's cpu data like fastest cores
- Looking for someone who has experience with rolling sqlite db file
  - Perferbly to stick with Entity Framework
  - Need to be able to configure to create a new db to write to every X period
- Looking for someone to help develop OSX support
- Looking for someone to help develop Linux support

## Platform / Support Focus

- Windows 11. (Will likely run fine on windows 10, but will require you to have
  [webview2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section) installed.)
  - You can check if webview 2 is installed already by going to the Start Menu --> Add or Remove Programs and searching for WebView2.
- 64bit only

---

## What is Vital

Vital is a modern alternative to Windows Task Manager. It aims to provide a familiar experience and more.

## Why use Vital?

- Find the process to kill faster with search 🗡️ (search by pid, name, title)
- Always On Top ensures Vital Utilities app is always above other apps when it matters the most. Unlike scaredy Task Manager 👻
- Dark theme so your retina is safe. 🐼
- Beautiful Graphs 📈📊
- Plentiful information 👓
- Persisted performance data ⛺
- More responsive than task manager 🏎️
- Process affinity/priority profiles 📷
  - Simply set and forget.
  - No more repetitive editing process affinities. We all know how bloody annoying it is that discord refuse to fix their compatibility issue with Voicemeeter. Simply set discord to one core and all your misery is gone!
  - Stop streaming applications like OBS from affecting your game's frame rates by pinning them to different cpu cores.
  - Maintain a useable machine while running cpu intensive workloads in the background. (i.e 3D rendering, video rendering, machine learning).
  - Prioritize performance critial applications over others.

## How to get the most out of Vital's Profiles?

- First identify which applications are competing with eachother for work time. Then assign them to different threads and or change the process priority to improve performance.

- The more threads the CPU has, the more freedom you will have with the affinity config.

## Vital's current limitations

- The Profile applyer at it's current state is a watch and apply service. This means application launched will use all threads and default priority until the apply service spots it in the next scheduled run.

- Vital wont magically give you free performance, the performance gain is dependent on the user's ability to identify conflicts and affectively resolving it.
  - Ability to share and import profiles is planned.
- Vital currently isnt aware of how many cores/threads an individual process requires to operate normally, it is up to the user to investigate this. If the user limits a process affinity to a count that is less than what the process needs to run optimally, the process will likely run terribly.
- Vital currently is missing some features seen in Task Manager, eventually the gaps will be filled.

## Running Vital Service with admin priviledges

VitalService.exe is the back bone of the application, without it the app will not work. Admin privileges for VitalService.exe is not required but recommended.
Not giving VitalService.exe admin priviledges will lead to the following results:

- Some machine stats will not be collected due to LibreHardware requiring it to collect them.
- Process Manager will not be able to modify the affinity of some processes. ('audiodg' as an example)

## Auto start Vital Service on log in

If you want your profiles applied and metrics collected when you log in. You can go into settings on the UI and add enable run on log in.

## Things being worked on

### V1

- Custom Installer.
- Check for new updates.
- Quick Common Fixes. (common issues users experience fixed with a few clicks).
  - Fix Discord + Voicemeeter Audio problem (Create a profile with audioDg set with one thread).
- Metrics data retention config.
- Metrics sqlite splitting (Rolling file).
- Display process GPU usage in Processes Page.
- Open Vital Utilities via Right click Context menu.
- Lightweight alt+f4 like shortcut for easily killing deadlocked apps that just wont die.
- Export Import Profiles
- Alerts

### Distant Future Goals

- Correlate process utilization with machine utilization
- Support Linux
- Support Mac Os (Wont be actively worked on by me, someone will have to take ownership of that code)
- Alerts / Notifications
- Plugins API (Allow third parties to make plugins for Vital)
- Drop .netcore and go complete Rust? 🤔
- Option to use PostgresDb or InfluxDb2 as timeseries db.
- InfluxDb2 integration. (currently not all metrics are being pushed)
- Affinity Whitelists. (only these processes can run on this thread)
- Auto updater.
- Default audio device enforcer. Windows refuses to honor your set default devices when you plug new things in!?!?!
- Alexa integration, so you can demand Alexa to turn off your machine from the comfort of your bed.
- Investigate possibility to throttle processes.
- Investigate the possibily of identifying specific processes that share the same process name, so we can be more specific with affinity assigning.
- Investigate if windows has hooks that we can use to apply affinity configs on app launch rather than poll running processes.
- Investigate IFTTT to work with Profiles. (if this process is running or its this time, then enable/disable this profile)
  - Recurring Tasks
    - Auto empty recyclebin
    - Auto clean directory with rules
    - Auto copy/move files from one directory to another
- Investigate ability to identify which threads a process has been executing work on.

## Screenshots

![vital_utilities_xh91hLBYCE](https://user-images.githubusercontent.com/19627023/150882479-397ee539-6a2c-4654-86ea-a9fa6d082340.gif)
![vital_utilities_0f28NydPeT](https://user-images.githubusercontent.com/19627023/150866174-3a918715-e606-4e30-8b56-8c8cacc5f9b2.gif)
![vital_utilities_zyB21Liz2u](https://user-images.githubusercontent.com/19627023/150884846-4d960bb8-feef-4564-8c7e-1a69f3c87704.gif)
![vital_utilities_Nt35LUPfzy](https://user-images.githubusercontent.com/19627023/150865860-d2739c78-f269-4498-b1b6-1813fe7319ec.png)
