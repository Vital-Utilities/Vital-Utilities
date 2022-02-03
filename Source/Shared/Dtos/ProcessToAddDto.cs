namespace VitalService.Dtos
{
    public struct ProcessToAddDto
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public int Pid { get; set; }
        public string ProcessName { get; set; }
        public string? ExecutionPath { get; set; }
        public bool CanModify { get; set; }
        public int[] Affinity { get; set; }
        public ProcessPriorityEnum ProcessPriority { get; set; }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
    }
}