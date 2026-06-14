using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities
{
    public class Employee
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int EmployeeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(80)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(15)]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [MaxLength(1)]
        [RegularExpression("^[MFO]$", ErrorMessage = "Gender must be M, F, or O")]
        public string? Gender { get; set; }

        [Required]
        public DateTime DOB { get; set; }

        [Required]
        public DateTime DOJ { get; set; }

        public int? DepartmentId { get; set; }

        public int? RoleId { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedOn { get; set; } = DateTime.Now;

        public DateTime? UpdatedOn { get; set; }

        // Navigation properties
        [ForeignKey("DepartmentId")]
        public Department? Department { get; set; }

        [ForeignKey("RoleId")]
        public Role? Role { get; set; }

        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<Leave> Leaves { get; set; } = new List<Leave>();
        public ICollection<EmployeeProject> EmployeeProjects { get; set; } = new List<EmployeeProject>();
        public UserLogin? UserLogin { get; set; }
    }
}
