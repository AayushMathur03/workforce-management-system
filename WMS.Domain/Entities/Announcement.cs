using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities
{
    public class Announcement
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AnnouncementId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Target audience for this announcement.
        /// Accepted values: "All", "Employee", "Manager", or any specific role name.
        /// Defaults to "All" for backwards compatibility.
        /// </summary>
        [MaxLength(50)]
        public string Audience { get; set; } = "All";

        [Required]
        public int CreatedBy { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.Now;

        public bool IsActive { get; set; } = true;
    }
}
