using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.DTOs.Employee;
using WMS.Application.Services.Interfaces;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeeController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _employeeService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _employeeService.GetByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string term)
            => Ok(await _employeeService.SearchAsync(term));

        [HttpPost]
        [AllowAnonymous] // TEMP: Remove after creating first admin
        public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
        {
            var result = await _employeeService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.EmployeeId }, result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeDto dto)
        {
            var result = await _employeeService.UpdateAsync(id, dto);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPut("deactivate/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var result = await _employeeService.DeleteAsync(id);
            return result ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _employeeService.DeleteAsync(id);
            return result ? NoContent() : NotFound();
        }
    }
}
