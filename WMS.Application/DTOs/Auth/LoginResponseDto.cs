namespace WMS.Application.DTOs.Auth
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int EmployeeId { get; set; }
        public DateTime Expiry { get; set; }
    }
}
