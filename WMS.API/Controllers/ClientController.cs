using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.DTOs.Client;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public ClientController(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var clients = await _uow.Clients.GetAllAsync();
            return Ok(_mapper.Map<IEnumerable<ClientDto>>(clients));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = await _uow.Clients.GetByIdAsync(id);
            return client == null ? NotFound() : Ok(_mapper.Map<ClientDto>(client));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] ClientDto dto)
        {
            var client = _mapper.Map<Client>(dto);
            await _uow.Clients.AddAsync(client);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = client.ClientId }, _mapper.Map<ClientDto>(client));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] ClientDto dto)
        {
            var client = await _uow.Clients.GetByIdAsync(id);
            if (client == null) return NotFound();
            _mapper.Map(dto, client);
            await _uow.Clients.UpdateAsync(client);
            await _uow.SaveChangesAsync();
            return Ok(_mapper.Map<ClientDto>(client));
        }

        [HttpPut("deactivate/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var client = await _uow.Clients.GetByIdAsync(id);
            if (client == null) return NotFound();
            client.Status = false;
            await _uow.Clients.UpdateAsync(client);
            await _uow.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _uow.Clients.DeleteAsync(id);
            await _uow.SaveChangesAsync();
            return NoContent();
        }
    }
}
