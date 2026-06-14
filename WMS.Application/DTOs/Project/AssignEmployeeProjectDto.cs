using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Project
{
    public class AssignEmployeeProjectDto
    {
        [Required]
        public int EmpId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public DateTime AssignedOn { get; set; }

        [Required]
        [MaxLength(50)]
        public string CreatedBy { get; set; } = string.Empty;
    }
}
