using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Department
{
    public class DepartmentDto
    {
        public int DepartmentId { get; set; }

        [Required]
        [MaxLength(100)]
        public string DepartmentName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Description { get; set; }
    }
}
