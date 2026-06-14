using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Data;

namespace WMS.Infrastructure.Repositories
{
    public class LeaveRepository : GenericRepository<Leave>, ILeaveRepository
    {
        public LeaveRepository(WmsDbContext context) : base(context) { }

        public async Task<IEnumerable<Leave>> GetLeavesByEmployeeAsync(int empId)
            => await _dbSet
                .Include(l => l.Employee)
                .Where(l => l.EmpId == empId)
                .OrderByDescending(l => l.AppliedOn)
                .ToListAsync();

        public async Task<IEnumerable<Leave>> GetPendingLeavesAsync()
            => await _dbSet
                .Include(l => l.Employee)
                .Where(l => l.Status == "Pending")
                .OrderBy(l => l.AppliedOn)
                .ToListAsync();

        public async Task<IEnumerable<Leave>> GetLeavesByStatusAsync(string status)
            => await _dbSet
                .Include(l => l.Employee)
                .Where(l => l.Status == status)
                .ToListAsync();
    }
}
