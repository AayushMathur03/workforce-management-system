using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces
{
    public interface ILeaveRepository : IGenericRepository<Leave>
    {
        Task<IEnumerable<Leave>> GetLeavesByEmployeeAsync(int empId);
        Task<IEnumerable<Leave>> GetPendingLeavesAsync();
        Task<IEnumerable<Leave>> GetLeavesByStatusAsync(string status);
    }
}
