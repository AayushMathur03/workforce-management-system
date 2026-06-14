using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.DTOs.Profile;
using WMS.Infrastructure.Data;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly WmsDbContext _context;
        private readonly IMapper _mapper;

        public ProfileController(WmsDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var empIdClaim = User.FindFirstValue("EmployeeId");
            if (empIdClaim == null) return Unauthorized();
            var empId = int.Parse(empIdClaim);

            var employee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Include(e => e.UserLogin)
                .FirstOrDefaultAsync(e => e.EmployeeId == empId);

            if (employee == null) return NotFound();
            return Ok(_mapper.Map<ProfileDto>(employee));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var empIdClaim = User.FindFirstValue("EmployeeId");
            if (empIdClaim == null) return Unauthorized();
            var empId = int.Parse(empIdClaim);

            var employee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Include(e => e.UserLogin)
                .FirstOrDefaultAsync(e => e.EmployeeId == empId);

            if (employee == null) return NotFound();

            if (dto.FirstName != null) employee.FirstName = dto.FirstName;
            if (dto.LastName != null) employee.LastName = dto.LastName;
            if (dto.PhoneNumber != null) employee.PhoneNumber = dto.PhoneNumber;
            if (dto.Gender != null) employee.Gender = dto.Gender;
            employee.UpdatedOn = DateTime.Now;

            _context.Employees.Update(employee);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<ProfileDto>(employee));
        }
    }
}
