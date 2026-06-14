using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities
{
    public class AuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AuditId { get; set; }

        public string? EntityName { get; set; }

        public int? RecordId { get; set; }

        [MaxLength(20)]
        public string? Action { get; set; }

        public int? CreatedBy { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.Now;
    }
}
