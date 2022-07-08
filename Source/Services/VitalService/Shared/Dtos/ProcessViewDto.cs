namespace VitalService.Dtos
{
    public class ProcessViewDto
    {
        [SwaggerRequired]
        public string ProcessName { get; set; }
        [SwaggerRequired]
        public string? ProcessTitle { get; set; }
        [SwaggerRequired]
        public string? Description { get; set; }
        [SwaggerRequired]
        public int Id { get; set; }

    }
}
