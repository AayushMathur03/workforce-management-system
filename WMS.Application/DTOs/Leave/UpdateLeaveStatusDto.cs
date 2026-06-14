using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Leave
{
    public class UpdateLeaveStatusDto
    {
        [Required]
        [RegularExpression("^(Approved|Rejected)$", ErrorMessage = "Status must be Approved or Rejected")]
        public string Status { get; set; } = string.Empty;

        [Required]
        public int ApprovedBy { get; set; }
    }
}
