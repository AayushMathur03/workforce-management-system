using WMS.Application.DTOs.Attendance;

namespace WMS.Application.Services.Interfaces
{
    public interface IAttendanceService
    {
        Task<AttendanceResponseDto> CheckInAsync(CheckInDto dto);
        Task<AttendanceResponseDto?> CheckOutAsync(int empId);
        Task<IEnumerable<AttendanceResponseDto>> GetMonthlyAsync(int empId, int month, int year);
        Task<IEnumerable<AttendanceResponseDto>> GetByEmployeeAsync(int empId);
    }
}
