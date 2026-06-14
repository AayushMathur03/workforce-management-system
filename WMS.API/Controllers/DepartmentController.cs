using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.DTOs.Department;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DepartmentController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public DepartmentController(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var departments = await _uow.Departments.GetAllAsync();
            return Ok(_mapper.Map<IEnumerable<DepartmentDto>>(departments));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var dept = await _uow.Departments.GetByIdAsync(id);
            return dept == null ? NotFound() : Ok(_mapper.Map<DepartmentDto>(dept));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] DepartmentDto dto)
        {
            var dept = _mapper.Map<Department>(dto);
            await _uow.Departments.AddAsync(dept);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = dept.DepartmentId }, _mapper.Map<DepartmentDto>(dept));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] DepartmentDto dto)
        {
            var dept = await _uow.Departments.GetByIdAsync(id);
            if (dept == null) return NotFound();
            _mapper.Map(dto, dept);
            await _uow.Departments.UpdateAsync(dept);
            await _uow.SaveChangesAsync();
            return Ok(_mapper.Map<DepartmentDto>(dept));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _uow.Departments.DeleteAsync(id);
            await _uow.SaveChangesAsync();
            return NoContent();
        }
    }
}
