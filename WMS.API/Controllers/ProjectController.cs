using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS.Application.DTOs.Project;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Data;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly WmsDbContext _context;

        public ProjectController(IUnitOfWork uow, IMapper mapper, WmsDbContext context)
        {
            _uow = uow;
            _mapper = mapper;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var projects = await _context.Projects
                .Include(p => p.Client)
                .ToListAsync();
            return Ok(_mapper.Map<IEnumerable<ProjectDto>>(projects));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Client)
                .FirstOrDefaultAsync(p => p.ProjectId == id);
            return project == null ? NotFound() : Ok(_mapper.Map<ProjectDto>(project));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] ProjectDto dto)
        {
            var project = _mapper.Map<Project>(dto);
            await _uow.Projects.AddAsync(project);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = project.ProjectId }, _mapper.Map<ProjectDto>(project));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] ProjectDto dto)
        {
            var project = await _uow.Projects.GetByIdAsync(id);
            if (project == null) return NotFound();
            _mapper.Map(dto, project);
            await _uow.Projects.UpdateAsync(project);
            await _uow.SaveChangesAsync();
            return Ok(_mapper.Map<ProjectDto>(project));
        }

        [HttpPut("complete/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Complete(int id)
        {
            var project = await _uow.Projects.GetByIdAsync(id);
            if (project == null) return NotFound();
            project.Status = "Completed";
            await _uow.Projects.UpdateAsync(project);
            await _uow.SaveChangesAsync();
            return Ok(new { projectId = id, status = "Completed" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _uow.Projects.DeleteAsync(id);
            await _uow.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("assign")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AssignEmployee([FromBody] AssignEmployeeProjectDto dto)
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
            return Ok(allocation);
        }

        [HttpGet("{projectId}/allocations")]
        public async Task<IActionResult> GetAllocations(int projectId)
        {
            var allocations = await _context.EmployeeProjects
                .Include(ep => ep.Employee)
                .Include(ep => ep.Project)
                .Where(ep => ep.ProjectId == projectId)
                .ToListAsync();
            return Ok(_mapper.Map<IEnumerable<EmployeeProjectResponseDto>>(allocations));
        }

        [HttpPut("allocations/{allocationId}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateAllocationStatus(int allocationId, [FromBody] bool status)
        {
            var allocation = await _uow.EmployeeProjects.GetByIdAsync(allocationId);
            if (allocation == null) return NotFound();
            allocation.Status = status;
            allocation.UpdatedDate = DateTime.Now;
            await _uow.EmployeeProjects.UpdateAsync(allocation);
            await _uow.SaveChangesAsync();
            return Ok(new { allocationId, status });
        }
    }
}
