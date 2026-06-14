using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.DTOs.Project;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Data;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectAllocationController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly WmsDbContext _context;

        public ProjectAllocationController(IUnitOfWork uow, IMapper mapper, WmsDbContext context)
        {
            _uow = uow;
            _mapper = mapper;
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAll()
        {
            var allocations = await _context.EmployeeProjects
                .Include(ep => ep.Employee)
                .Include(ep => ep.Project)
                .ToListAsync();
            return Ok(_mapper.Map<IEnumerable<EmployeeProjectResponseDto>>(allocations));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Assign([FromBody] AssignEmployeeProjectDto dto)
        {
            var allocation = new EmployeeProject
            {
                EmpId = dto.EmpId,
                ProjectId = dto.ProjectId,
                AssignedOn = dto.AssignedOn,
                CreateDate = DateTime.Now,
                CreatedBy = dto.CreatedBy,
                Status = true
            };
            await _uow.EmployeeProjects.AddAsync(allocation);
            await _uow.SaveChangesAsync();
            return Ok(_mapper.Map<EmployeeProjectResponseDto>(allocation));
        }

        [HttpGet("my-projects")]
        public async Task<IActionResult> GetMyProjects()
        {
            var empIdClaim = User.FindFirstValue("EmployeeId");
            if (empIdClaim == null) return Unauthorized();
            var empId = int.Parse(empIdClaim);

            var allocations = await _context.EmployeeProjects
                .Include(ep => ep.Employee)
                .Include(ep => ep.Project)
                .Where(ep => ep.EmpId == empId && ep.Status)
                .ToListAsync();
            return Ok(_mapper.Map<IEnumerable<EmployeeProjectResponseDto>>(allocations));
        }

        [HttpGet("team-projects")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetTeamProjects()
        {
            var allocations = await _context.EmployeeProjects
                .Include(ep => ep.Employee)
                .Include(ep => ep.Project)
                .Where(ep => ep.Status)
                .ToListAsync();
            return Ok(_mapper.Map<IEnumerable<EmployeeProjectResponseDto>>(allocations));
        }

        [HttpPut("deactivate/{allocationId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Deactivate(int allocationId)
        {
            var allocation = await _uow.EmployeeProjects.GetByIdAsync(allocationId);
            if (allocation == null) return NotFound();
            allocation.Status = false;
            allocation.UpdatedDate = DateTime.Now;
            await _uow.EmployeeProjects.UpdateAsync(allocation);
            await _uow.SaveChangesAsync();
            return NoContent();
        }
    }
}
