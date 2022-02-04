namespace VitalService.Dtos
{
    public class ManagedModelDto
    {
        public int Id { get; set; }
        public string ProcessName { get; set; }
        public string Alias { get; set; }
        public ProcessPriorityEnum ProcessPriority { get; set; }
        public string ExecutablePath { get; set; }
        public int[] Affinity { get; set; }
        public int ParentProfileId { get; set; }

        public ManagedModelDto(int id, string processName, string alias, ProcessPriorityEnum processPriority, int[] affinity, int parentProfileId)
        {
            Id = id;
            ProcessName = processName;
            Alias = alias;
            ProcessPriority = processPriority;
            Affinity = affinity;
            ParentProfileId = parentProfileId;
        }
    }

}