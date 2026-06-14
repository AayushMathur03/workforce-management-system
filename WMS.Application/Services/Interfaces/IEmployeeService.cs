using WMS.Application.DTOs.Employee;

namespace WMS.Application.Services.Interfaces
{
    public interface IEmployeeService
    {
        Task<IEnumerable<EmployeeResponseDto>> GetAllAsync();
        Task<EmployeeResponseDto?> GetByIdAsync(int id);
        Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto dto);
        Task<EmployeeResponseDto?> UpdateAsync(int id, UpdateEmployeeDto dto);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<EmployeeResponseDto>> SearchAsync(string term);
    }
}
