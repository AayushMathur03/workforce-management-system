using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using WMS.Application.DTOs.Auth;
using WMS.Application.Services;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUnitOfWork> _uow;
    private readonly IConfiguration _config;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _uow = new Mock<IUnitOfWork>();

        var auditLogRepo = new Mock<IGenericRepository<AuditLog>>();
        auditLogRepo.Setup(r => r.AddAsync(It.IsAny<AuditLog>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.AuditLogs).Returns(auditLogRepo.Object);

        var inMemorySettings = new Dictionary<string, string>
        {
            { "Jwt:Key", "WMS@SecretKey#2026$JwtToken!SuperSecure" },
            { "Jwt:Issuer", "WMSApp" },
            { "Jwt:Audience", "WMSUsers" }
        };
        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings!)
            .Build();

        _sut = new AuthService(_uow.Object, _config);
    }

    // --------------- LoginAsync ---------------

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsLoginResponse()
    {
        // Arrange
        var hash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        var users = new List<UserLogin>
        {
            new() { UserId = 1, EmployeeId = 1, Username = "admin", PasswordHash = hash, RoleId = 1 }
        };
        var roles = new List<Role> { new() { RoleId = 1, RoleName = "Admin" } };

        _uow.Setup(u => u.UserLogins.GetByUsernameAsync("admin")).ReturnsAsync(users[0]);
        _uow.Setup(u => u.UserLogins.UpdateAsync(It.IsAny<UserLogin>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _uow.Setup(u => u.Roles.GetAllAsync()).ReturnsAsync(roles);

        var dto = new LoginRequestDto { Username = "admin", Password = "Admin@123" };

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result!.Username.Should().Be("admin");
        result.Role.Should().Be("Admin");
        result.EmployeeId.Should().Be(1);
        result.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task LoginAsync_UserNotFound_ReturnsNull()
    {
        // Arrange
        _uow.Setup(u => u.UserLogins.GetByUsernameAsync("nobody")).ReturnsAsync((UserLogin)null!);

        var dto = new LoginRequestDto { Username = "nobody", Password = "pass" };

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsNull()
    {
        // Arrange
        var hash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword");
        var users = new List<UserLogin>
        {
            new() { UserId = 1, EmployeeId = 1, Username = "admin", PasswordHash = hash, RoleId = 1 }
        };
        _uow.Setup(u => u.UserLogins.GetByUsernameAsync("admin")).ReturnsAsync(users[0]);

        var dto = new LoginRequestDto { Username = "admin", Password = "WrongPassword" };

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_UpdatesLastLogin()
    {
        // Arrange
        var hash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        var user = new UserLogin { UserId = 1, EmployeeId = 1, Username = "admin", PasswordHash = hash, RoleId = 1 };
        _uow.Setup(u => u.UserLogins.GetByUsernameAsync("admin")).ReturnsAsync(user);
        _uow.Setup(u => u.UserLogins.UpdateAsync(It.IsAny<UserLogin>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _uow.Setup(u => u.Roles.GetAllAsync()).ReturnsAsync(new List<Role> { new() { RoleId = 1, RoleName = "Admin" } });

        // Act
        await _sut.LoginAsync(new LoginRequestDto { Username = "admin", Password = "Admin@123" });

        // Assert — LastLogin was set
        user.LastLogin.Should().NotBeNull();
        _uow.Verify(u => u.SaveChangesAsync(), Times.Exactly(2));
    }

    // --------------- ChangePasswordAsync ---------------

    [Fact]
    public async Task ChangePasswordAsync_CorrectCurrentPassword_ReturnsTrue()
    {
        // Arrange
        var hash = BCrypt.Net.BCrypt.HashPassword("OldPass@123");
        var user = new UserLogin { UserId = 1, EmployeeId = 1, Username = "admin", PasswordHash = hash };
        _uow.Setup(u => u.UserLogins.GetByIdAsync(1)).ReturnsAsync(user);
        _uow.Setup(u => u.UserLogins.UpdateAsync(It.IsAny<UserLogin>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ChangePasswordDto { CurrentPassword = "OldPass@123", NewPassword = "NewPass@456" };

        // Act
        var result = await _sut.ChangePasswordAsync(1, dto);

        // Assert
        result.Should().BeTrue();
        BCrypt.Net.BCrypt.Verify("NewPass@456", user.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task ChangePasswordAsync_WrongCurrentPassword_ThrowsArgumentException()
    {
        // Arrange
        var hash = BCrypt.Net.BCrypt.HashPassword("CorrectPass@123");
        var user = new UserLogin { UserId = 1, EmployeeId = 1, Username = "admin", PasswordHash = hash };
        _uow.Setup(u => u.UserLogins.GetByIdAsync(1)).ReturnsAsync(user);

        var dto = new ChangePasswordDto { CurrentPassword = "WrongPass", NewPassword = "NewPass@456" };

        // Act
        var act = async () => await _sut.ChangePasswordAsync(1, dto);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Current password is incorrect.");
    }

    [Fact]
    public async Task ChangePasswordAsync_UserNotFound_ReturnsFalse()
    {
        // Arrange
        _uow.Setup(u => u.UserLogins.GetByIdAsync(999)).ReturnsAsync((UserLogin)null!);

        var dto = new ChangePasswordDto { CurrentPassword = "any", NewPassword = "NewPass@456" };

        // Act
        var result = await _sut.ChangePasswordAsync(999, dto);

        // Assert
        result.Should().BeFalse();
    }
}
