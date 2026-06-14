using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Data;

namespace WMS.Infrastructure.Repositories
{
    public class UserLoginRepository : GenericRepository<UserLogin>, IUserLoginRepository
    {
        public UserLoginRepository(WmsDbContext context) : base(context) { }

        public async Task<UserLogin?> GetByUsernameAsync(string username)
            => await _dbSet
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == username);
    }
}
