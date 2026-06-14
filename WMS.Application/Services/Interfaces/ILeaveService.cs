using WMS.Application.DTOs.Leave;

namespace WMS.Application.Services.Interfaces
{
    public interface ILeaveService
    {
        Task<LeaveResponseDto> ApplyAsync(ApplyLeaveDto dto);
        Task<LeaveResponseDto?> UpdateStatusAsync(int leaveId, UpdateLeaveStatusDto dto);
        Task<bool> CancelAsync(int leaveId, int empId);
        Task<IEnumerable<LeaveResponseDto>> GetByEmployeeAsync(int empId);
        Task<IEnumerable<LeaveResponseDto>> GetPendingAsync();
    }
}
