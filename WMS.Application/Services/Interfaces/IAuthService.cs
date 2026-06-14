using WMS.Application.DTOs.Auth;

namespace WMS.Application.Services.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto);
        Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto);
    }
}
