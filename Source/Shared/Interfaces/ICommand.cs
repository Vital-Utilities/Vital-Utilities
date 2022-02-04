using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace VitalService.Interfaces
{
    public interface ICommand
    {
        string FriendlyName { get; init; }
        string Description { get; init; }
        Task<int> Execute(CancellationToken cancellationToken);

    }
    public interface ISchedule
    {
        TimeSpan Interval { get; set; }
        DateTime LastExecuted { get; }
        string Name { get; init; }
        ICommand ExecutingCommand { get; init; }
    }
}
