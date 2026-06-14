using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.DTOs.AuditLog;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AuditLogController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public AuditLogController(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var logs = await _uow.AuditLogs.GetAllAsync();
            return Ok(_mapper.Map<IEnumerable<AuditLogDto>>(logs));
        }

        [HttpGet("entity/{entityName}")]
        public async Task<IActionResult> GetByEntity(string entityName)
        {
            var logs = await _uow.AuditLogs.GetAllAsync();
            var filtered = logs.Where(l => l.EntityName != null &&
                l.EntityName.Equals(entityName, StringComparison.OrdinalIgnoreCase));
            return Ok(_mapper.Map<IEnumerable<AuditLogDto>>(filtered));
        }
    }
}
