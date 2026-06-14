using AutoMapper;
using WMS.Application.DTOs.Employee;
using WMS.Application.Services.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public EmployeeService(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<IEnumerable<EmployeeResponseDto>> GetAllAsync()
        {
            var employees = await _uow.Employees.GetAllAsync();
            return _mapper.Map<IEnumerable<EmployeeResponseDto>>(employees);
        }

        public async Task<EmployeeResponseDto?> GetByIdAsync(int id)
        {
            var employee = await _uow.Employees.GetByIdAsync(id);
            return employee == null ? null : _mapper.Map<EmployeeResponseDto>(employee);
        }

        public async Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto dto)
        {
            var employee = _mapper.Map<Employee>(dto);
            await _uow.Employees.AddAsync(employee);
            await _uow.SaveChangesAsync();

            // Create user login
            var login = new UserLogin
            {
                EmployeeId = employee.EmployeeId,
                Username = dto.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                RoleId = dto.RoleId
            };
            await _uow.UserLogins.AddAsync(login);
            await _uow.SaveChangesAsync();

            // Audit log
            await _uow.AuditLogs.AddAsync(new AuditLog
            {
                EntityName = "Employee",
                RecordId = employee.EmployeeId,
                Action = "Create",
                CreatedBy = employee.EmployeeId,
                CreatedOn = DateTime.Now
            });
            await _uow.SaveChangesAsync();

            return _mapper.Map<EmployeeResponseDto>(employee);
        }

        public async Task<EmployeeResponseDto?> UpdateAsync(int id, UpdateEmployeeDto dto)
        {
            var employee = await _uow.Employees.GetByIdAsync(id);
            if (employee == null) return null;

            _mapper.Map(dto, employee);
            employee.UpdatedOn = DateTime.Now;
            await _uow.Employees.UpdateAsync(employee);
            await _uow.SaveChangesAsync();

            // Audit log
            await _uow.AuditLogs.AddAsync(new AuditLog
            {
                EntityName = "Employee",
                RecordId = id,
                Action = "Update",
                CreatedOn = DateTime.Now
            });
            await _uow.SaveChangesAsync();

            return _mapper.Map<EmployeeResponseDto>(employee);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var employee = await _uow.Employees.GetByIdAsync(id);
            if (employee == null) return false;

            employee.Status = "Inactive";
            employee.UpdatedOn = DateTime.Now;
            await _uow.Employees.UpdateAsync(employee);
            await _uow.SaveChangesAsync();

            // Audit log
            await _uow.AuditLogs.AddAsync(new AuditLog
            {
                EntityName = "Employee",
                RecordId = id,
                Action = "Deactivate",
                CreatedOn = DateTime.Now
            });
            await _uow.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<EmployeeResponseDto>> SearchAsync(string term)
        {
            var employees = await _uow.Employees.SearchAsync(term);
            return _mapper.Map<IEnumerable<EmployeeResponseDto>>(employees);
        }
    }
}
