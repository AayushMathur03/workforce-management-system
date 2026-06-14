using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities
{
    public class Role
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RoleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Description { get; set; }

        // Navigation
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public ICollection<UserLogin> UserLogins { get; set; } = new List<UserLogin>();
    }
}
