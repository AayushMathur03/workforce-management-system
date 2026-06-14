using AutoMapper;
using FluentAssertions;
using Moq;
using WMS.Application.DTOs.Attendance;
using WMS.Application.Mappings;
using WMS.Application.Services;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Tests;

public class AttendanceServiceTests
{
    private readonly Mock<IUnitOfWork> _uow;
    private readonly IMapper _mapper;
    private readonly AttendanceService _sut;

    public AttendanceServiceTests()
    {
        _uow = new Mock<IUnitOfWork>();

        var auditLogRepo = new Mock<IGenericRepository<AuditLog>>();
        auditLogRepo.Setup(r => r.AddAsync(It.IsAny<AuditLog>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.AuditLogs).Returns(auditLogRepo.Object);

        _mapper = new MapperConfiguration(cfg => cfg.AddProfile<AutoMapperProfile>())
            .CreateMapper();
        _sut = new AttendanceService(_uow.Object, _mapper);
    }

    // --------------- CheckInAsync ---------------

    [Fact]
    public async Task CheckInAsync_NoExistingRecord_CreatesAndReturnsRecord()
    {
        // Arrange
        _uow.Setup(u => u.Attendances.GetTodayAttendanceAsync(1, It.IsAny<DateTime>()))
            .ReturnsAsync((Attendance?)null);
        _uow.Setup(u => u.Attendances.AddAsync(It.IsAny<Attendance>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var dto = new CheckInDto { EmpId = 1, WorkMode = "WFO" };

        // Act
        var result = await _sut.CheckInAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.EmpId.Should().Be(1);
        result.WorkMode.Should().Be("WFO");
        result.CheckOut.Should().BeNull();
        _uow.Verify(u => u.Attendances.AddAsync(It.IsAny<Attendance>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(), Times.Exactly(2));
    }

    [Fact]
    public async Task CheckInAsync_AlreadyCheckedInToday_ThrowsInvalidOperationException()
    {
        // Arrange
        var existing = new Attendance { AttendanceId = 1, EmpId = 1, CheckIn = DateTime.Now };
        _uow.Setup(u => u.Attendances.GetTodayAttendanceAsync(1, It.IsAny<DateTime>()))
            .ReturnsAsync(existing);

        var dto = new CheckInDto { EmpId = 1, WorkMode = "Remote" };

        // Act
        var act = async () => await _sut.CheckInAsync(dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Already checked in today.");
    }

    [Fact]
    public async Task CheckInAsync_SetsAttendanceDateToToday()
    {
        // Arrange
        Attendance? captured = null;
        _uow.Setup(u => u.Attendances.GetTodayAttendanceAsync(1, It.IsAny<DateTime>()))
            .ReturnsAsync((Attendance?)null);
        _uow.Setup(u => u.Attendances.AddAsync(It.IsAny<Attendance>()))
            .Callback<Attendance>(a => captured = a)
            .Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        await _sut.CheckInAsync(new CheckInDto { EmpId = 1, WorkMode = "WFH" });

        // Assert
        captured.Should().NotBeNull();
        captured!.AttendanceDate.Date.Should().Be(DateTime.Today);
    }

    // --------------- CheckOutAsync ---------------

    [Fact]
    public async Task CheckOutAsync_ValidCheckIn_SetsCheckOutAndReturnsRecord()
    {
        // Arrange
        var existing = new Attendance
        {
            AttendanceId = 1, EmpId = 1,
            CheckIn = DateTime.Now.AddHours(-8),
            CheckOut = null,
            AttendanceDate = DateTime.Today
        };
        _uow.Setup(u => u.Attendances.GetTodayAttendanceAsync(1, It.IsAny<DateTime>()))
            .ReturnsAsync(existing);
        _uow.Setup(u => u.Attendances.UpdateAsync(It.IsAny<Attendance>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        // Act
        var result = await _sut.CheckOutAsync(1);

        // Assert
        result.Should().NotBeNull();
        existing.CheckOut.Should().NotBeNull();
        _uow.Verify(u => u.Attendances.UpdateAsync(It.IsAny<Attendance>()), Times.Once);
    }

    [Fact]
    public async Task CheckOutAsync_NoCheckInFound_ReturnsNull()
    {
        // Arrange
        _uow.Setup(u => u.Attendances.GetTodayAttendanceAsync(1, It.IsAny<DateTime>()))
            .ReturnsAsync((Attendance?)null);

        // Act
        var result = await _sut.CheckOutAsync(1);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CheckOutAsync_AlreadyCheckedOut_ThrowsInvalidOperationException()
    {
        // Arrange
        var existing = new Attendance
        {
            AttendanceId = 1, EmpId = 1,
            CheckIn = DateTime.Now.AddHours(-8),
            CheckOut = DateTime.Now.AddHours(-1),
            AttendanceDate = DateTime.Today
        };
        _uow.Setup(u => u.Attendances.GetTodayAttendanceAsync(1, It.IsAny<DateTime>()))
            .ReturnsAsync(existing);

        // Act
        var act = async () => await _sut.CheckOutAsync(1);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Already checked out today.");
    }

    // --------------- GetMonthlyAsync ---------------

    [Fact]
    public async Task GetMonthlyAsync_ReturnsRecordsForCorrectMonthAndYear()
    {
        // Arrange
        var records = new List<Attendance>
        {
            new() { AttendanceId = 1, EmpId = 1, CheckIn = new DateTime(2026, 6, 1, 9, 0, 0), AttendanceDate = new DateTime(2026, 6, 1) },
            new() { AttendanceId = 2, EmpId = 1, CheckIn = new DateTime(2026, 6, 2, 9, 0, 0), AttendanceDate = new DateTime(2026, 6, 2) }
        };
        _uow.Setup(u => u.Attendances.GetMonthlyAttendanceAsync(1, 6, 2026))
            .ReturnsAsync(records);

        // Act
        var result = await _sut.GetMonthlyAsync(1, 6, 2026);

        // Assert
        result.Should().HaveCount(2);
        result.All(r => r.EmpId == 1).Should().BeTrue();
    }
}
