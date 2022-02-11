using System.ComponentModel.DataAnnotations.Schema;
using VitalService.Dtos;

namespace VitalService.Data.App
{
    public class ManagedModel
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [System.ComponentModel.DataAnnotations.Key]
        public int Id { get; set; }

        public string ProcessName { get; set; }
        public string ExecutionPath { get; set; }
        public string Alias { get; set; }
        public ProcessPriorityEnum ProcessPriority { get; set; }
        public string AffinityBinary { get; set; }
        public int ParentProfileId { get; set; }
        public ProfileModel ProfileModel { get; set; }

#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public ManagedModel()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {

        }

        public ManagedModel(string processName, string executionPath, string alias, string affinityBinary, ProcessPriorityEnum processPriority, int parentProfileId)
        {
            ProcessName = processName;
            ExecutionPath = executionPath;
            Alias = alias;
            ProcessPriority = processPriority;
            AffinityBinary = affinityBinary;
            ParentProfileId = parentProfileId;
        }
        public ManagedModel(int id, string processName, string executionPath, string alias, string affinityBinary, ProcessPriorityEnum processPriority, int parentProfileId)
        {
            Id = id;
            ProcessName = processName;
            ExecutionPath = executionPath;
            Alias = alias;
            ProcessPriority = processPriority;
            AffinityBinary = affinityBinary;
            ParentProfileId = parentProfileId;
        }
    }
}