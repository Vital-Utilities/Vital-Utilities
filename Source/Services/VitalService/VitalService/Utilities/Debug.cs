using Serilog;
using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace VitalService.Utilities
{
    public static class Debug
    {
        public static Task LogExecutionTime(string? detail, Action action, bool disable = false)
        {
            if (disable || !Log.IsEnabled(Serilog.Events.LogEventLevel.Debug))
            {
                action.Invoke();
                return Task.CompletedTask;
            }
            var stackTrace = new StackTrace();
            var method = stackTrace.GetFrame(1)?.GetMethod();

            var watch = Stopwatch.StartNew();
            var task = new Task(action);
            task.RunSynchronously();
            watch.Stop();

            if (task.Exception is not null)
                Log.Logger.Error(task.Exception.GetBaseException(), "something broke");
            var detailStr = detail is null ? string.Empty : detail;
            Log.Logger.Debug($"[{{@Elapsed}}ms] {method?.DeclaringType?.Name}.{method?.Name}{{@detail}}", watch.ElapsedMilliseconds.ToString().PadLeft(5, ' '), !string.IsNullOrEmpty(detailStr) ? $" => {detailStr}" : "");

            return Task.CompletedTask;
        }
    }
}
