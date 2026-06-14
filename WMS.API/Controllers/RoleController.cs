using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public RoleController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _uow.Roles.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var role = await _uow.Roles.GetByIdAsync(id);
            return role == null ? NotFound() : Ok(role);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] Role dto)
        {
            var role = new Role { RoleName = dto.RoleName, Description = dto.Description };
            await _uow.Roles.AddAsync(role);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = role.RoleId }, role);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] Role dto)
        {
            var role = await _uow.Roles.GetByIdAsync(id);
            if (role == null) return NotFound();
            role.RoleName = dto.RoleName;
            role.Description = dto.Description;
            await _uow.Roles.UpdateAsync(role);
            await _uow.SaveChangesAsync();
            return Ok(role);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _uow.Roles.DeleteAsync(id);
            await _uow.SaveChangesAsync();
            return NoContent();
        }
    }
}
