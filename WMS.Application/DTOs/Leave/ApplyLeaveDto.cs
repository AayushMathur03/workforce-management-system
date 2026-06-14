using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Leave
{
    public class ApplyLeaveDto
    {
        [Required]
        public int EmpId { get; set; }

        [Required]
        [MaxLength(30)]
        public string LeaveType { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Reason { get; set; }

        [Required]
        public DateTime FromDate { get; set; }

        [Required]
        public DateTime ToDate { get; set; }
    }
}
