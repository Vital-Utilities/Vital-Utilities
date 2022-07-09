namespace VitalService.Dtos
{
    public class ProfileDto
    {
        
        public int Id { get; set; }
        
        public string Name { get; set; }
        
        public int[] ManagedModelsIds { get; set; }
        
        public bool Enabled { get; set; }
        
        public bool Active { get; set; }
        
        public int? Priority { get; set; }

#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public ProfileDto() { }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        public ProfileDto(int id, string name, int[] managedModelIds, bool enabled, bool active, int? priority = null)
        {
            Name = name;
            Id = id;
            ManagedModelsIds = managedModelIds;
            Active = active;
            Priority = priority;
            Enabled = enabled;
        }
    }
}
