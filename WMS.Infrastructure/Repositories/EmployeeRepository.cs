using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Data;

namespace WMS.Infrastructure.Repositories
{
    public class EmployeeRepository : GenericRepository<Employee>, IEmployeeRepository
    {
        public EmployeeRepository(WmsDbContext context) : base(context) { }

        public override async Task<IEnumerable<Employee>> GetAllAsync()
            => await _dbSet
                .AsNoTracking()
                .Include(e => e.Department)
                .Include(e => e.Role)
                .ToListAsync();

        public async Task<Employee?> GetByEmailAsync(string email)
            => await _dbSet
                .Include(e => e.Department)
                .Include(e => e.Role)
                .FirstOrDefaultAsync(e => e.Email == email);

        public async Task<IEnumerable<Employee>> GetByDepartmentAsync(int departmentId)
            => await _dbSet
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Where(e => e.DepartmentId == departmentId)
                .ToListAsync();

        public async Task<IEnumerable<Employee>> SearchAsync(string searchTerm)
            => await _dbSet
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Where(e =>
                    e.FirstName.Contains(searchTerm) ||
                    e.LastName.Contains(searchTerm) ||
                    e.Email.Contains(searchTerm))
                .ToListAsync();
    }
}
