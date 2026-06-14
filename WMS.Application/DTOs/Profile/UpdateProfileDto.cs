using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Profile
{
    public class UpdateProfileDto
    {
        [MaxLength(50)]
        public string? FirstName { get; set; }

        [MaxLength(50)]
        public string? LastName { get; set; }

        [MaxLength(15)]
        public string? PhoneNumber { get; set; }

        [RegularExpression("^[MFO]$")]
        public string? Gender { get; set; }
    }
}
