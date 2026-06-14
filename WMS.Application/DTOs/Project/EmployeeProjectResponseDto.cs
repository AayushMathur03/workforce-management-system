namespace WMS.Application.DTOs.Project
{
    public class EmployeeProjectResponseDto
    {
        public int AllocationId { get; set; }
        public int EmpId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public DateTime AssignedOn { get; set; }
        public bool Status { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? UpdatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}
