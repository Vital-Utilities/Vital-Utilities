namespace VitalService.Dtos
{
    public class AddProccessRequest
    {
        public string ProcessName { get; set; }
        public string Alias { get; set; }
        public string ExecutionPath { get; set; }
        public ProcessPriorityEnum ProcessPriority { get; set; }
        public int[] Affinity { get; set; }
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