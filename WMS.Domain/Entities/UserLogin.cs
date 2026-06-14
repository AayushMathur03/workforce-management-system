using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities
{
    public class UserLogin
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserId { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public int? RoleId { get; set; }

        public DateTime? LastLogin { get; set; }

        // Navigation
        [ForeignKey("EmployeeId")]
        public Employee Employee { get; set; } = null!;

        [ForeignKey("RoleId")]
        public Role? Role { get; set; }
    }
}
