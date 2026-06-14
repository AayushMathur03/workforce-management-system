using AutoMapper;
using FluentAssertions;
using Moq;
using WMS.Application.DTOs.Employee;
using WMS.Application.Mappings;
using WMS.Application.Services;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Tests;

public class EmployeeServiceTests
{
    private readonly Mock<IUnitOfWork> _uow;
    private readonly IMapper _mapper;
    private readonly EmployeeService _sut;

    public EmployeeServiceTests()
    {
        _uow = new Mock<IUnitOfWork>();

        var auditLogRepo = new Mock<IGenericRepository<AuditLog>>();
        auditLogRepo.Setup(r => r.AddAsync(It.IsAny<AuditLog>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.AuditLogs).Returns(auditLogRepo.Object);

        var userLoginRepo = new Mock<IUserLoginRepository>();
        userLoginRepo.Setup(r => r.AddAsync(It.IsAny<UserLogin>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.UserLogins).Returns(userLoginRepo.Object);

        _mapper = new MapperConfiguration(cfg => cfg.AddProfile<AutoMapperProfile>())
            .CreateMapper();
        _sut = new EmployeeService(_uow.Object, _mapper);
    }

    // --------------- GetAllAsync ---------------

    [Fact]
    public async Task GetAllAsync_ReturnsAllEmployees()
    {
        // Arrange
        var employees = new List<Employee>
        {
            new() { EmployeeId = 1, FirstName = "System", LastName = "Admin", Email = "admin@wms.com", PhoneNumber = "9999999999", DOB = new DateTime(1990,1,1), DOJ = new DateTime(2024,1,1), Status = "Active" },
            new() { EmployeeId = 2, FirstName = "Rahul", LastName = "Sharma", Email = "rahul@wms.com", PhoneNumber = "9876543210", DOB = new DateTime(1995,6,15), DOJ = new DateTime(2024,1,10), Status = "Active" }
        };
        _uow.Setup(u => u.Employees.GetAllAsync()).ReturnsAsync(employees);

        // Act
        var result = await _sut.GetAllAsync();

        // Assert
        result.Should().HaveCount(2);
    }

    // --------------- GetByIdAsync ---------------

    [Fact]
    public async Task GetByIdAsync_ExistingEmployee_ReturnsDto()
    {
        // Arrange
        var emp = new Employee { EmployeeId = 1, FirstName = "System", LastName = "Admin", Email = "admin@wms.com", PhoneNumber = "9999999999", DOB = new DateTime(1990,1,1), DOJ = new DateTime(2024,1,1), Status = "Active" };
        _uow.Setup(u => u.Employees.GetByIdAsync(1)).ReturnsAsync(emp);

        // Act
        var result = await _sut.GetByIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.EmployeeId.Should().Be(1);
        result.FullName.Should().Be("System Admin");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistentEmployee_ReturnsNull()
    {
        // Arrange
        _uow.Setup(u => u.Employees.GetByIdAsync(999)).ReturnsAsync((Employee?)null);

        // Act
        var result = await _sut.GetByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    // --------------- CreateAsync ---------------

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesEmployeeAndUserLogin()
    {
        // Arrange
        _uow.Setup(u => u.Employees.AddAsync(It.IsAny<Employee>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.UserLogins.AddAsync(It.IsAny<UserLogin>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _uow.Setup(u => u.Employees.GetByIdAsync(It.IsAny<int>()))
            .ReturnsAsync((Employee?)null);

        var dto = new CreateEmployeeDto
        {
            FirstName = "Jane",
            LastName = "Doe",
            Email = "jane@wms.com",
            PhoneNumber = "9000000001",
            DOB = new DateTime(1992, 3, 15),
            DOJ = new DateTime(2025, 1, 1),
            DepartmentId = 1,
            RoleId = 3,
            Username = "jane.doe",
            Password = "Pass@123"
        };

        // Act
        var result = await _sut.CreateAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.FirstName.Should().Be("Jane");
        result.FullName.Should().Be("Jane Doe");
        _uow.Verify(u => u.Employees.AddAsync(It.IsAny<Employee>()), Times.Once);
        _uow.Verify(u => u.UserLogins.AddAsync(It.IsAny<UserLogin>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(), Times.AtLeastOnce);
    }

    [Fact]
    public async Task CreateAsync_PasswordIsHashedWithBCrypt()
    {
        // Arrange
        UserLogin? capturedLogin = null;
        _uow.Setup(u => u.Employees.AddAsync(It.IsAny<Employee>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.UserLogins.AddAsync(It.IsAny<UserLogin>()))
            .Callback<UserLogin>(ul => capturedLogin = ul)
            .Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new CreateEmployeeDto
        {
            FirstName = "Test", LastName = "User", Email = "test@wms.com",
            PhoneNumber = "9000000002", DOB = new DateTime(1993, 1, 1),
            DOJ = new DateTime(2025, 1, 1), Username = "test.user", Password = "PlainPass@1"
        };

        // Act
        await _sut.CreateAsync(dto);

        // Assert — password stored is NOT the plain text
        capturedLogin.Should().NotBeNull();
        capturedLogin!.PasswordHash.Should().NotBe("PlainPass@1");
        BCrypt.Net.BCrypt.Verify("PlainPass@1", capturedLogin.PasswordHash).Should().BeTrue();
    }

    // --------------- UpdateAsync ---------------

    [Fact]
    public async Task UpdateAsync_ExistingEmployee_UpdatesAndReturnsDto()
    {
        // Arrange
        var emp = new Employee
        {
            EmployeeId = 2, FirstName = "Rahul", LastName = "Sharma",
            Email = "rahul@wms.com", PhoneNumber = "9876543210",
            DOB = new DateTime(1995,6,15), DOJ = new DateTime(2024,1,10), Status = "Active"
        };
        _uow.Setup(u => u.Employees.GetByIdAsync(2)).ReturnsAsync(emp);
        _uow.Setup(u => u.Employees.UpdateAsync(It.IsAny<Employee>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new UpdateEmployeeDto { PhoneNumber = "1111111111", Status = "Active" };

        // Act
        var result = await _sut.UpdateAsync(2, dto);

        // Assert
        result.Should().NotBeNull();
        emp.PhoneNumber.Should().Be("1111111111");
        emp.UpdatedOn.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateAsync_NonExistentEmployee_ReturnsNull()
    {
        // Arrange
        _uow.Setup(u => u.Employees.GetByIdAsync(999)).ReturnsAsync((Employee?)null);

        // Act
        var result = await _sut.UpdateAsync(999, new UpdateEmployeeDto());

        // Assert
        result.Should().BeNull();
    }

    // --------------- DeleteAsync (soft delete) ---------------

    [Fact]
    public async Task DeleteAsync_ExistingEmployee_SetsStatusInactiveAndReturnsTrue()
    {
        // Arrange
        var emp = new Employee
        {
            EmployeeId = 2, FirstName = "Rahul", LastName = "Sharma",
            Email = "rahul@wms.com", PhoneNumber = "9876543210",
            DOB = new DateTime(1995,6,15), DOJ = new DateTime(2024,1,10), Status = "Active"
        };
        _uow.Setup(u => u.Employees.GetByIdAsync(2)).ReturnsAsync(emp);
        _uow.Setup(u => u.Employees.UpdateAsync(It.IsAny<Employee>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        var result = await _sut.DeleteAsync(2);

        // Assert
        result.Should().BeTrue();
        emp.Status.Should().Be("Inactive");
        emp.UpdatedOn.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteAsync_NonExistentEmployee_ReturnsFalse()
    {
        // Arrange
        _uow.Setup(u => u.Employees.GetByIdAsync(999)).ReturnsAsync((Employee?)null);

        // Act
        var result = await _sut.DeleteAsync(999);

        // Assert
        result.Should().BeFalse();
    }

    // --------------- SearchAsync ---------------

    [Fact]
    public async Task SearchAsync_MatchingTerm_ReturnsMatchingEmployees()
    {
        // Arrange
        var employees = new List<Employee>
        {
            new() { EmployeeId = 1, FirstName = "System", LastName = "Admin", Email = "admin@wms.com", PhoneNumber = "9999999999", DOB = new DateTime(1990,1,1), DOJ = new DateTime(2024,1,1), Status = "Active" }
        };
        _uow.Setup(u => u.Employees.SearchAsync("admin")).ReturnsAsync(employees);

        // Act
        var result = await _sut.SearchAsync("admin");

        // Assert
        result.Should().HaveCount(1);
        result.First().FirstName.Should().Be("System");
    }

    [Fact]
    public async Task SearchAsync_NoMatch_ReturnsEmptyList()
    {
        // Arrange
        _uow.Setup(u => u.Employees.SearchAsync("xyz")).ReturnsAsync(new List<Employee>());

        // Act
        var result = await _sut.SearchAsync("xyz");

        // Assert
        result.Should().BeEmpty();
    }
}
