using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces
{
    public interface IAttendanceRepository : IGenericRepository<Attendance>
    {
        Task<Attendance?> GetTodayAttendanceAsync(int empId, DateTime date);
        Task<IEnumerable<Attendance>> GetMonthlyAttendanceAsync(int empId, int month, int year);
        Task<IEnumerable<Attendance>> GetByEmployeeAsync(int empId);
    }
}
