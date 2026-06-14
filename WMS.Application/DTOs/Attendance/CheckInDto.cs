using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Attendance
{
    public class CheckInDto
    {
        [Required]
        public int EmpId { get; set; }

        [MaxLength(20)]
        public string? WorkMode { get; set; }
    }
}
