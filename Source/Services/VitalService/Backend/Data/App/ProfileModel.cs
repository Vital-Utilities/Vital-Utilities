using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VitalService.Data.App
{
    public class ProfileModel
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public List<ManagedModel> ManagedModels { get; set; }
        public bool Enabled { get; set; }
        public int? Priority { get; set; }

#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public ProfileModel()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {

        }

        public ProfileModel(int id, string name, List<ManagedModel> managedModels, bool enabled, int? priority)
        {
            Id = id;
            Name = name;
            ManagedModels = managedModels;
            Enabled = enabled;
            Priority = priority;
        }

        public ProfileModel(string name)
        {
            Name = name;
            ManagedModels = new List<ManagedModel>();
        }
    }
}
