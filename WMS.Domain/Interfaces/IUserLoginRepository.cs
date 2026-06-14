using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces
{
    public interface IUserLoginRepository : IGenericRepository<UserLogin>
    {
        Task<UserLogin?> GetByUsernameAsync(string username);
    }
}
