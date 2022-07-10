using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VitalService.Dtos.Data.Metrics
{
    public interface IHardwareMetric
    {
        
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Key]
        public int Id { get; set; }
        public string? UniqueIdentifier { get; set; }
    }

    public abstract class HardwareMetricModel : IHardwareMetric
    {
        
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Key]
        public int Id { get; set; }
        
        public string? UniqueIdentifier { get; set; }

        public HardwareMetricModel(string? uniqueIdentifier = null)
        {
            UniqueIdentifier = uniqueIdentifier;
        }
    }

}
