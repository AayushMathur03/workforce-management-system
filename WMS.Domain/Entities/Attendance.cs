using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities
{
    public class Attendance
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AttendanceId { get; set; }

        [Required]
        public int EmpId { get; set; }

        [Required]
        public DateTime CheckIn { get; set; }

        public DateTime? CheckOut { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal? TotalHours { get; set; }

        [MaxLength(20)]
        public string? WorkMode { get; set; }

        [Required]
        public DateTime AttendanceDate { get; set; }

        // Navigation
        [ForeignKey("EmpId")]
        public Employee Employee { get; set; } = null!;
    }
}
