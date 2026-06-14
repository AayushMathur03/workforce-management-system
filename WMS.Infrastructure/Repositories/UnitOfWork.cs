using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Data;

namespace WMS.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly WmsDbContext _context;

        public IEmployeeRepository Employees { get; private set; }
        public IAttendanceRepository Attendances { get; private set; }
        public ILeaveRepository Leaves { get; private set; }
        public IGenericRepository<Department> Departments { get; private set; }
        public IGenericRepository<Role> Roles { get; private set; }
        public IGenericRepository<Project> Projects { get; private set; }
        public IGenericRepository<Client> Clients { get; private set; }
        public IGenericRepository<EmployeeProject> EmployeeProjects { get; private set; }
        public IUserLoginRepository UserLogins { get; private set; }
        public IGenericRepository<Announcement> Announcements { get; private set; }
        public IGenericRepository<AuditLog> AuditLogs { get; private set; }

        public UnitOfWork(WmsDbContext context)
        {
            _context = context;
            Employees = new EmployeeRepository(context);
            Attendances = new AttendanceRepository(context);
            Leaves = new LeaveRepository(context);
            Departments = new GenericRepository<Department>(context);
            Roles = new GenericRepository<Role>(context);
            Projects = new GenericRepository<Project>(context);
            Clients = new GenericRepository<Client>(context);
            EmployeeProjects = new GenericRepository<EmployeeProject>(context);
            UserLogins = new UserLoginRepository(context);
            Announcements = new GenericRepository<Announcement>(context);
            AuditLogs = new GenericRepository<AuditLog>(context);
        }

        public async Task<int> SaveChangesAsync()
            => await _context.SaveChangesAsync();

        public void Dispose()
            => _context.Dispose();
    }
}
