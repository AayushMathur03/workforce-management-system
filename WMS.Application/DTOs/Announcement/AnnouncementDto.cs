using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Announcement
{
    public class AnnouncementDto
    {
        public int AnnouncementId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Target audience: "All", "Employee", "Manager", or a specific role name.
        /// </summary>
        [MaxLength(50)]
        public string Audience { get; set; } = "All";

        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
