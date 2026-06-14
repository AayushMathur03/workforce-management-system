namespace WMS.Application.DTOs.AuditLog
{
    public class AuditLogDto
    {
        public int AuditId { get; set; }
        public string? EntityName { get; set; }
        public int? RecordId { get; set; }
        public string? Action { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
    }
}
