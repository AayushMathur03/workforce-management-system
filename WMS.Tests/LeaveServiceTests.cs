using AutoMapper;
using FluentAssertions;
using Moq;
using WMS.Application.DTOs.Leave;
using WMS.Application.Mappings;
using WMS.Application.Services;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Tests;

public class LeaveServiceTests
{
    private readonly Mock<IUnitOfWork> _uow;
    private readonly IMapper _mapper;
    private readonly LeaveService _sut;

    public LeaveServiceTests()
    {
        _uow = new Mock<IUnitOfWork>();

        var auditLogRepo = new Mock<IGenericRepository<AuditLog>>();
        auditLogRepo.Setup(r => r.AddAsync(It.IsAny<AuditLog>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.AuditLogs).Returns(auditLogRepo.Object);

        _mapper = new MapperConfiguration(cfg => cfg.AddProfile<AutoMapperProfile>())
            .CreateMapper();
        _sut = new LeaveService(_uow.Object, _mapper);
    }

    // --------------- ApplyAsync ---------------

    [Fact]
    public async Task ApplyAsync_ValidDates_CreatesLeaveWithPendingStatus()
    {
        // Arrange
        _uow.Setup(u => u.Leaves.AddAsync(It.IsAny<Leave>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ApplyLeaveDto
        {
            EmpId = 1,
            LeaveType = "Sick",
            Reason = "Fever",
            FromDate = new DateTime(2026, 7, 1),
            ToDate = new DateTime(2026, 7, 2)
        };

        // Act
        var result = await _sut.ApplyAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("Pending");
        result.LeaveType.Should().Be("Sick");
        _uow.Verify(u => u.Leaves.AddAsync(It.IsAny<Leave>()), Times.Once);
    }

    [Fact]
    public async Task ApplyAsync_ToDateBeforeFromDate_ThrowsArgumentException()
    {
        // Arrange
        var dto = new ApplyLeaveDto
        {
            EmpId = 1,
            LeaveType = "Casual",
            FromDate = new DateTime(2026, 7, 10),
            ToDate = new DateTime(2026, 7, 5)
        };

        // Act
        var act = async () => await _sut.ApplyAsync(dto);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*ToDate*");
    }

    [Fact]
    public async Task ApplyAsync_SameDayLeave_Succeeds()
    {
        // Arrange
        _uow.Setup(u => u.Leaves.AddAsync(It.IsAny<Leave>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new ApplyLeaveDto
        {
            EmpId = 2,
            LeaveType = "Casual",
            FromDate = new DateTime(2026, 7, 1),
            ToDate = new DateTime(2026, 7, 1)
        };

        // Act
        var result = await _sut.ApplyAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("Pending");
    }

    // --------------- UpdateStatusAsync ---------------

    [Fact]
    public async Task UpdateStatusAsync_ValidLeave_ApprovesAndSetsApprovedOn()
    {
        // Arrange
        var leave = new Leave
        {
            LeaveId = 1, EmpId = 2, LeaveType = "Sick",
            FromDate = DateTime.Today, ToDate = DateTime.Today.AddDays(1),
            Status = "Pending"
        };
        _uow.Setup(u => u.Leaves.GetByIdAsync(1)).ReturnsAsync(leave);
        _uow.Setup(u => u.Leaves.UpdateAsync(It.IsAny<Leave>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new UpdateLeaveStatusDto { Status = "Approved", ApprovedBy = 1 };

        // Act
        var result = await _sut.UpdateStatusAsync(1, dto);

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be("Approved");
        leave.ApprovedBy.Should().Be(1);
        leave.ApprovedOn.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateStatusAsync_RejectLeave_SetsStatusToRejected()
    {
        // Arrange
        var leave = new Leave
        {
            LeaveId = 2, EmpId = 3, LeaveType = "Casual",
            FromDate = DateTime.Today, ToDate = DateTime.Today,
            Status = "Pending"
        };
        _uow.Setup(u => u.Leaves.GetByIdAsync(2)).ReturnsAsync(leave);
        _uow.Setup(u => u.Leaves.UpdateAsync(It.IsAny<Leave>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new UpdateLeaveStatusDto { Status = "Rejected", ApprovedBy = 1 };

        // Act
        var result = await _sut.UpdateStatusAsync(2, dto);

        // Assert
        result!.Status.Should().Be("Rejected");
    }

    [Fact]
    public async Task UpdateStatusAsync_LeaveNotFound_ReturnsNull()
    {
        // Arrange
        _uow.Setup(u => u.Leaves.GetByIdAsync(999)).ReturnsAsync((Leave?)null);

        // Act
        var result = await _sut.UpdateStatusAsync(999, new UpdateLeaveStatusDto { Status = "Approved", ApprovedBy = 1 });

        // Assert
        result.Should().BeNull();
    }

    // --------------- CancelAsync ---------------

    [Fact]
    public async Task CancelAsync_PendingLeaveOwnedByEmployee_ReturnsTrue()
    {
        // Arrange
        var leave = new Leave { LeaveId = 1, EmpId = 2, Status = "Pending" };
        _uow.Setup(u => u.Leaves.GetByIdAsync(1)).ReturnsAsync(leave);
        _uow.Setup(u => u.Leaves.UpdateAsync(It.IsAny<Leave>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        var result = await _sut.CancelAsync(1, 2);

        // Assert
        result.Should().BeTrue();
        leave.Status.Should().Be("Cancelled");
        _uow.Verify(u => u.Leaves.UpdateAsync(It.IsAny<Leave>()), Times.Once);
    }

    [Fact]
    public async Task CancelAsync_LeaveNotFound_ReturnsFalse()
    {
        // Arrange
        _uow.Setup(u => u.Leaves.GetByIdAsync(999)).ReturnsAsync((Leave?)null);

        // Act
        var result = await _sut.CancelAsync(999, 1);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task CancelAsync_LeaveNotOwnedByEmployee_ReturnsFalse()
    {
        // Arrange
        var leave = new Leave { LeaveId = 1, EmpId = 5, Status = "Pending" };
        _uow.Setup(u => u.Leaves.GetByIdAsync(1)).ReturnsAsync(leave);

        // Act — employee 2 tries to cancel employee 5's leave
        var result = await _sut.CancelAsync(1, 2);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task CancelAsync_AlreadyApprovedLeave_ThrowsInvalidOperationException()
    {
        // Arrange — service throws when leave is not Pending
        var leave = new Leave { LeaveId = 1, EmpId = 2, Status = "Approved" };
        _uow.Setup(u => u.Leaves.GetByIdAsync(1)).ReturnsAsync(leave);

        // Act
        var act = async () => await _sut.CancelAsync(1, 2);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only pending leaves can be cancelled.");
    }

    // --------------- GetByEmployeeAsync / GetPendingAsync ---------------

    [Fact]
    public async Task GetByEmployeeAsync_ReturnsOnlyThatEmployeesLeaves()
    {
        // Arrange
        var leaves = new List<Leave>
        {
            new() { LeaveId = 1, EmpId = 2, LeaveType = "Sick", FromDate = DateTime.Today, ToDate = DateTime.Today, Status = "Pending" },
            new() { LeaveId = 2, EmpId = 2, LeaveType = "Casual", FromDate = DateTime.Today, ToDate = DateTime.Today, Status = "Approved" }
        };
        _uow.Setup(u => u.Leaves.GetLeavesByEmployeeAsync(2)).ReturnsAsync(leaves);

        // Act
        var result = await _sut.GetByEmployeeAsync(2);

        // Assert
        result.Should().HaveCount(2);
        result.All(l => l.EmpId == 2).Should().BeTrue();
    }

    [Fact]
    public async Task GetPendingAsync_ReturnsOnlyPendingLeaves()
    {
        // Arrange
        var pending = new List<Leave>
        {
            new() { LeaveId = 1, EmpId = 3, LeaveType = "Sick", FromDate = DateTime.Today, ToDate = DateTime.Today, Status = "Pending" }
        };
        _uow.Setup(u => u.Leaves.GetPendingLeavesAsync()).ReturnsAsync(pending);

        // Act
        var result = await _sut.GetPendingAsync();

        // Assert
        result.Should().HaveCount(1);
        result.First().Status.Should().Be("Pending");
    }
}
