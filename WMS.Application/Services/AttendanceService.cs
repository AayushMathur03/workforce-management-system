using AutoMapper;
using WMS.Application.DTOs.Attendance;
using WMS.Application.Services.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Services
{
    public class AttendanceService : IAttendanceService
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public AttendanceService(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<AttendanceResponseDto> CheckInAsync(CheckInDto dto)
        {
            var existing = await _uow.Attendances.GetTodayAttendanceAsync(dto.EmpId, DateTime.Today);
            if (existing != null)
                throw new InvalidOperationException("Already checked in today.");

            var attendance = new Attendance
            {
                EmpId = dto.EmpId,
                CheckIn = DateTime.Now,
                AttendanceDate = DateTime.Today,
                WorkMode = dto.WorkMode
            };

            await _uow.Attendances.AddAsync(attendance);
            await _uow.SaveChangesAsync();

            // Audit log
            await _uow.AuditLogs.AddAsync(new AuditLog
            {
                EntityName = "Attendance",
                RecordId = attendance.AttendanceId,
                Action = "CheckIn",
                CreatedBy = dto.EmpId,
                CreatedOn = DateTime.Now
            });
            await _uow.SaveChangesAsync();

            return _mapper.Map<AttendanceResponseDto>(attendance);
        }

        public async Task<AttendanceResponseDto?> CheckOutAsync(int empId)
        {
            var attendance = await _uow.Attendances.GetTodayAttendanceAsync(empId, DateTime.Today);
            if (attendance == null) return null;
            if (attendance.CheckOut != null)
                throw new InvalidOperationException("Already checked out today.");

            attendance.CheckOut = DateTime.Now;
            await _uow.Attendances.UpdateAsync(attendance);
            await _uow.SaveChangesAsync();

            // Audit log
            await _uow.AuditLogs.AddAsync(new AuditLog
            {
                EntityName = "Attendance",
                RecordId = attendance.AttendanceId,
                Action = "CheckOut",
                CreatedBy = empId,
                CreatedOn = DateTime.Now
            });
            await _uow.SaveChangesAsync();

            return _mapper.Map<AttendanceResponseDto>(attendance);
        }

        public async Task<IEnumerable<AttendanceResponseDto>> GetMonthlyAsync(int empId, int month, int year)
        {
            var records = await _uow.Attendances.GetMonthlyAttendanceAsync(empId, month, year);
            return _mapper.Map<IEnumerable<AttendanceResponseDto>>(records);
        }

        public async Task<IEnumerable<AttendanceResponseDto>> GetByEmployeeAsync(int empId)
        {
            var records = await _uow.Attendances.GetByEmployeeAsync(empId);
            return _mapper.Map<IEnumerable<AttendanceResponseDto>>(records);
        }
    }
}
