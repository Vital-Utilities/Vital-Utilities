namespace VitalService.Dtos
{
    public class ManagedModelDto
    {
        [SwaggerRequired]
        public int Id { get; set; }
        [SwaggerRequired]
        public string ProcessName { get; set; }
        [SwaggerRequired]
        public string Alias { get; set; }
        [SwaggerRequired]
        public ProcessPriorityEnum ProcessPriority { get; set; }
        [SwaggerRequired]
        public int[] Affinity { get; set; }
        [SwaggerRequired]
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