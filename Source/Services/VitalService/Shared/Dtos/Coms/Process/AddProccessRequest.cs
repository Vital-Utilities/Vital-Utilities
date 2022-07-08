namespace VitalService.Dtos
{
    public class AddProccessRequest
    {
        [SwaggerRequired]
        public string ProcessName { get; set; }
        [SwaggerRequired]
        public string Alias { get; set; }
        [SwaggerRequired]
        public string ExecutionPath { get; set; }
        [SwaggerRequired]
        public ProcessPriorityEnum ProcessPriority { get; set; }
        [SwaggerRequired]
        public int[] Affinity { get; set; }
        [SwaggerRequired]
        public int ProfileId { get; set; }
        public AddProccessRequest(string processName, string executionPath, string alias, ProcessPriorityEnum processPriority, int[] affinity, int profileId)
        {
            ProcessName = processName;
            ExecutionPath = executionPath;
            Alias = alias;
            ProcessPriority = processPriority;
            Affinity = affinity;
            ProfileId = profileId;
        }

    }
}