using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Data;

namespace WMS.Infrastructure.Repositories
{
    public class AttendanceRepository : GenericRepository<Attendance>, IAttendanceRepository
    {
        public AttendanceRepository(WmsDbContext context) : base(context) { }

        public async Task<Attendance?> GetTodayAttendanceAsync(int empId, DateTime date)
            => await _dbSet
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.EmpId == empId &&
                    a.AttendanceDate.Date == date.Date);

        public async Task<IEnumerable<Attendance>> GetMonthlyAttendanceAsync(int empId, int month, int year)
            => await _dbSet
                .AsNoTracking()
                .Include(a => a.Employee)
                .Where(a => a.EmpId == empId &&
                    a.AttendanceDate.Month == month &&
                    a.AttendanceDate.Year == year)
                .OrderBy(a => a.AttendanceDate)
                .ToListAsync();

        public async Task<IEnumerable<Attendance>> GetByEmployeeAsync(int empId)
            => await _dbSet
                .AsNoTracking()
                .Include(a => a.Employee)
                .Where(a => a.EmpId == empId)
                .OrderByDescending(a => a.AttendanceDate)
                .ToListAsync();
    }
}
