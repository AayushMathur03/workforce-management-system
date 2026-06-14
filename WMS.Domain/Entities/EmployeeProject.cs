using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities
{
    public class EmployeeProject
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AllocationId { get; set; }

        [Required]
        public int EmpId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public DateTime AssignedOn { get; set; }

        [Required]
        public DateTime CreateDate { get; set; } = DateTime.Now;

        [Required]
        [MaxLength(50)]
        public string CreatedBy { get; set; } = string.Empty;

        public bool Status { get; set; } = true;

        [MaxLength(50)]
        public string? UpdatedBy { get; set; }

        public DateTime? UpdatedDate { get; set; }

        // Navigation
        [ForeignKey("EmpId")]
        public Employee Employee { get; set; } = null!;

        [ForeignKey("ProjectId")]
        public Project Project { get; set; } = null!;
    }
}
