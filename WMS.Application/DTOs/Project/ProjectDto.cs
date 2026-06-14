using System.ComponentModel.DataAnnotations;

namespace WMS.Application.DTOs.Project
{
    public class ProjectDto
    {
        public int ProjectId { get; set; }

        [Required]
        [MaxLength(100)]
        public string ProjectName { get; set; } = string.Empty;

        public int? ClientId { get; set; }
        public string? ClientName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Active";
    }
}
