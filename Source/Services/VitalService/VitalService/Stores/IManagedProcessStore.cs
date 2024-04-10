using System.Collections.Generic;
using System.Threading.Tasks;
using VitalService.Data.App;

namespace VitalService.Stores
{
    public interface IManagedProcessStore
    {
        Task<ManagedModel[]> GetAsync();
        Task<ManagedModel[]> GetAsync(IEnumerable<int> ids);
        Task<ManagedModel?> GetAsync(string name);
        Task<ManagedModel?> GetAsync(int id);
        Task RemoveAsync(ManagedModel model);
        Task RemoveAsync(int id);
    }
}