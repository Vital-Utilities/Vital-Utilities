namespace VitalService.Dtos
{
    public class ProfileDto
    {
        [SwaggerRequired]
        public int Id { get; set; }
        [SwaggerRequired]
        public string Name { get; set; }
        [SwaggerRequired]
        public int[] ManagedModelsIds { get; set; }
        [SwaggerRequired]
        public bool Enabled { get; set; }
        [SwaggerRequired]
        public bool Active { get; set; }
        [SwaggerRequired]
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
