using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace VitalService.Dtos
{
    public enum ProcessPriorityEnum
    {
        [Description("Dont Override")] DontOverride,
        [Description("Idle")] Idle,
        [Description("BelowNormal")] BelowNormal,
        [Description("Normal")] Normal,
        [Description("Above Normal")] AboveNormal,
        [Description("High")] High,
        [Description("Real Time")] RealTime
    }
}
