using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Announcement
{
    public class CreateAnnouncementDto
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Target audience: "All", "Employee", "Manager", or a specific role name.
        /// Defaults to "All" when not provided.
        /// </summary>
        [MaxLength(50)]
        public string Audience { get; set; } = "All";

        [Required]
        public int CreatedBy { get; set; }
    }
}
