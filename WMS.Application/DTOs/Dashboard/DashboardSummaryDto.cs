namespace WMS.Application.DTOs.Dashboard
{
    public class DashboardSummaryDto
    {
        public int TotalEmployees { get; set; }
        public int ActiveEmployees { get; set; }
        public int TodayCheckIns { get; set; }
        public int PendingLeaves { get; set; }
        public int ActiveProjects { get; set; }
        public int TotalDepartments { get; set; }
        public int TotalClients { get; set; }
    }
}
