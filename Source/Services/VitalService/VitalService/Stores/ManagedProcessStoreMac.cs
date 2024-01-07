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
    [SupportedOSPlatform("osx")]
    public class ManagedProcessStoreMac: IManagedProcessStore
    {
        public ManagedProcessStoreMac()
        {
        }

        public async Task<ManagedModel[]> GetAsync() => [];
        public async Task<ManagedModel[]> GetAsync(IEnumerable<int> ids) => [];
        public async Task<ManagedModel?> GetAsync(string name) => null;

        public async Task<ManagedModel?> GetAsync(int id) => null;

        public async Task RemoveAsync(ManagedModel model)
        {
        }

        public async Task RemoveAsync(int id)
        {
        }
    }
}
