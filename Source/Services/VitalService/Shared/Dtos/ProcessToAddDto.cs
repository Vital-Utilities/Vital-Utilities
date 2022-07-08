namespace VitalService.Dtos
{
    public struct ProcessToAddDto
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        [SwaggerRequired]
        public int Pid { get; set; }
        [SwaggerRequired]
        public string ProcessName { get; set; }
        [SwaggerRequired]
        public string MainWindowTitle { get; set; }
        [SwaggerRequired]
        public string? ExecutionPath { get; set; }
        [SwaggerRequired]
        public bool CanModify { get; set; }
        [SwaggerRequired]
        public int[] Affinity { get; set; }
        [SwaggerRequired]
        public ProcessPriorityEnum ProcessPriority { get; set; }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
    }
}