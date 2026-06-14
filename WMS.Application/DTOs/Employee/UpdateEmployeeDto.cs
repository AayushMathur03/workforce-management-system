using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Employee
{
    public class UpdateEmployeeDto
    {
        [MaxLength(50)]
        public string? FirstName { get; set; }

        [MaxLength(50)]
        public string? LastName { get; set; }

        [MaxLength(15)]
        public string? PhoneNumber { get; set; }

        [RegularExpression("^[MFO]$")]
        public string? Gender { get; set; }

        public int? DepartmentId { get; set; }

        public int? RoleId { get; set; }

        [MaxLength(20)]
        public string? Status { get; set; }
    }
}
