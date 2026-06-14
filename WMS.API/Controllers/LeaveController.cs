using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.DTOs.Leave;
using WMS.Application.Services.Interfaces;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaveController : ControllerBase
    {
        private readonly ILeaveService _leaveService;

        public LeaveController(ILeaveService leaveService)
        {
            _leaveService = leaveService;
        }

        [HttpPost("apply")]
        public async Task<IActionResult> Apply([FromBody] ApplyLeaveDto dto)
            => Ok(await _leaveService.ApplyAsync(dto));

        // Target spec: PUT /api/Leave/{leaveId}/review
        [HttpPut("{id}/review")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Review(int id, [FromBody] UpdateLeaveStatusDto dto)
        {
            var result = await _leaveService.UpdateStatusAsync(id, dto);
            return result == null ? NotFound() : Ok(result);
        }

        // Existing route preserved
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateLeaveStatusDto dto)
        {
            var result = await _leaveService.UpdateStatusAsync(id, dto);
            return result == null ? NotFound() : Ok(result);
        }

        // Target spec: DELETE /api/Leave/{leaveId}  (cancel by JWT user)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancel(int id)
        {
            var empIdClaim = User.FindFirstValue("EmployeeId");
            if (empIdClaim == null) return Unauthorized();
            var empId = int.Parse(empIdClaim);
            var result = await _leaveService.CancelAsync(id, empId);
            return result ? NoContent() : NotFound();
        }

        // Existing route preserved
        [HttpPut("{id}/cancel/{empId}")]
        public async Task<IActionResult> CancelByEmpId(int id, int empId)
        {
            var result = await _leaveService.CancelAsync(id, empId);
            return result ? NoContent() : NotFound();
        }

        // Target spec: GET /api/Leave/my-leaves (JWT-scoped)
        [HttpGet("my-leaves")]
        public async Task<IActionResult> GetMyLeaves()
        {
            var empIdClaim = User.FindFirstValue("EmployeeId");
            if (empIdClaim == null) return Unauthorized();
            var empId = int.Parse(empIdClaim);
            return Ok(await _leaveService.GetByEmployeeAsync(empId));
        }

        // Existing route preserved
        [HttpGet("employee/{empId}")]
        public async Task<IActionResult> GetByEmployee(int empId)
            => Ok(await _leaveService.GetByEmployeeAsync(empId));

        [HttpGet("pending")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetPending()
            => Ok(await _leaveService.GetPendingAsync());
    }
}
