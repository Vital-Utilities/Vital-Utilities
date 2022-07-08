namespace VitalService.Dtos.Coms
{
    public struct MotherBoardData
    {
        [SwaggerRequired]
        public string? Name { get; set; }
        [SwaggerRequired]
        public string? Bios { get; set; }
    }
}
