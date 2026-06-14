namespace WMS.Application.DTOs.Attendance
{
    public class AttendanceResponseDto
    {
        public int AttendanceId { get; set; }
        public int EmpId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }
        public decimal? TotalHours { get; set; }
        public string? WorkMode { get; set; }
        public DateTime AttendanceDate { get; set; }
    }
}
