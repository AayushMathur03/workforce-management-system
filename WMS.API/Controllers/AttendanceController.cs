using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.DTOs.Attendance;
using WMS.Application.Services.Interfaces;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        [HttpPost("checkin")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
            => Ok(await _attendanceService.CheckInAsync(dto));

        [HttpPost("checkout")]
        public async Task<IActionResult> CheckOut([FromBody] int empId)
        {
            var result = await _attendanceService.CheckOutAsync(empId);
            return result == null ? NotFound(new { message = "No check-in found for today." }) : Ok(result);
        }

        [HttpPut("checkout/{empId}")]
        public async Task<IActionResult> CheckOutPut(int empId)
        {
            var result = await _attendanceService.CheckOutAsync(empId);
            return result == null ? NotFound(new { message = "No check-in found for today." }) : Ok(result);
        }

        [HttpGet("my-attendance")]
        public async Task<IActionResult> GetMyAttendance()
        {
            var empIdClaim = User.FindFirstValue("EmployeeId");
            if (empIdClaim == null) return Unauthorized();
            var empId = int.Parse(empIdClaim);
            return Ok(await _attendanceService.GetByEmployeeAsync(empId));
        }

        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthly([FromQuery] int empId, [FromQuery] int month, [FromQuery] int year)
            => Ok(await _attendanceService.GetMonthlyAsync(empId, month, year));

        [HttpGet("monthly/{empId}")]
        public async Task<IActionResult> GetMonthlyByPath(int empId, [FromQuery] int month, [FromQuery] int year)
            => Ok(await _attendanceService.GetMonthlyAsync(empId, month, year));

        [HttpGet("employee/{employeeId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetByEmployee(int employeeId)
            => Ok(await _attendanceService.GetByEmployeeAsync(employeeId));
    }
}
