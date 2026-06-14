using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS.Application.DTOs.Dashboard;
using WMS.Infrastructure.Data;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly WmsDbContext _context;

        public DashboardController(WmsDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var today = DateTime.Today;

            var totalEmployees = await _context.Employees.CountAsync();
            var activeEmployees = await _context.Employees.CountAsync(e => e.Status == "Active");
            var todayCheckIns = await _context.Attendances.CountAsync(a => a.AttendanceDate == today);
            var pendingLeaves = await _context.Leaves.CountAsync(l => l.Status == "Pending");
            var activeProjects = await _context.Projects.CountAsync(p => p.Status == "Active");
            var totalDepartments = await _context.Departments.CountAsync();
            var totalClients = await _context.Clients.CountAsync(c => c.Status == true);

            var summary = new DashboardSummaryDto
            {
                TotalEmployees = totalEmployees,
                ActiveEmployees = activeEmployees,
                TodayCheckIns = todayCheckIns,
                PendingLeaves = pendingLeaves,
                ActiveProjects = activeProjects,
                TotalDepartments = totalDepartments,
                TotalClients = totalClients
            };

            return Ok(summary);
        }
    }
}
