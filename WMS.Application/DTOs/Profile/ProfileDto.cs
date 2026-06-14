namespace WMS.Application.DTOs.Profile
{
    public class ProfileDto
    {
        public int EmployeeId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public DateTime DOB { get; set; }
        public DateTime DOJ { get; set; }
        public string? DepartmentName { get; set; }
        public string? RoleName { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
    }
}
