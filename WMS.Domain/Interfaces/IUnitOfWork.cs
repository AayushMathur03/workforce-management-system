namespace WMS.Domain.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IEmployeeRepository Employees { get; }
        IAttendanceRepository Attendances { get; }
        ILeaveRepository Leaves { get; }
        IGenericRepository<WMS.Domain.Entities.Department> Departments { get; }
        IGenericRepository<WMS.Domain.Entities.Role> Roles { get; }
        IGenericRepository<WMS.Domain.Entities.Project> Projects { get; }
        IGenericRepository<WMS.Domain.Entities.Client> Clients { get; }
        IGenericRepository<WMS.Domain.Entities.EmployeeProject> EmployeeProjects { get; }
        IUserLoginRepository UserLogins { get; }
        IGenericRepository<WMS.Domain.Entities.Announcement> Announcements { get; }
        IGenericRepository<WMS.Domain.Entities.AuditLog> AuditLogs { get; }
        Task<int> SaveChangesAsync();
    }
}
