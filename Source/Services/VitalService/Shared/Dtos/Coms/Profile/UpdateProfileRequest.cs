
namespace VitalService.Dtos
{
    public class UpdateProfileRequest
    {
        [SwaggerRequired]
        public ProfileDto Profile { get; set; }
    }
}
