using AutoMapper;
using WMS.Application.DTOs.Leave;
using WMS.Application.Services.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Services
{
    public class LeaveService : ILeaveService
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public LeaveService(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<LeaveResponseDto> ApplyAsync(ApplyLeaveDto dto)
        {
            if (dto.ToDate < dto.FromDate)
                throw new ArgumentException("ToDate cannot be before FromDate.");

            var leave = _mapper.Map<Leave>(dto);
            leave.Status = "Pending";
            leave.AppliedOn = DateTime.Now;

            await _uow.Leaves.AddAsync(leave);
            await _uow.SaveChangesAsync();

            // Audit log
            await _uow.AuditLogs.AddAsync(new AuditLog
            {
                EntityName = "Leave",
                RecordId = leave.LeaveId,
                Action = "Create",
                CreatedBy = dto.EmpId,
                CreatedOn = DateTime.Now
            });
            await _uow.SaveChangesAsync();

            return _mapper.Map<LeaveResponseDto>(leave);
        }

        public async Task<LeaveResponseDto?> UpdateStatusAsync(int leaveId, UpdateLeaveStatusDto dto)
        {
            var leave = await _uow.Leaves.GetByIdAsync(leaveId);
            if (leave == null) return null;

            leave.Status = dto.Status;
            leave.ApprovedBy = dto.ApprovedBy;
            leave.ApprovedOn = DateTime.Now;

            await _uow.Leaves.UpdateAsync(leave);
            await _uow.SaveChangesAsync();

            // Audit log — action reflects the new status (Approved / Rejected)
            await _uow.AuditLogs.AddAsync(new AuditLog
            {
                EntityName = "Leave",
                RecordId = leaveId,
                Action = dto.Status,   // "Approved", "Rejected", etc.
                CreatedBy = dto.ApprovedBy,
                CreatedOn = DateTime.Now
            });
            await _uow.SaveChangesAsync();

            return _mapper.Map<LeaveResponseDto>(leave);
        }

        public async Task<bool> CancelAsync(int leaveId, int empId)
        {
            var leave = await _uow.Leaves.GetByIdAsync(leaveId);
            if (leave == null || leave.EmpId != empId) return false;
            if (leave.Status != "Pending")
                throw new InvalidOperationException("Only pending leaves can be cancelled.");

            leave.Status = "Cancelled";
            await _uow.Leaves.UpdateAsync(leave);
            await _uow.SaveChangesAsync();

            // Audit log
            await _uow.AuditLogs.AddAsync(new AuditLog
            {
                EntityName = "Leave",
                RecordId = leaveId,
                Action = "Cancel",
                CreatedBy = empId,
                CreatedOn = DateTime.Now
            });
            await _uow.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<LeaveResponseDto>> GetByEmployeeAsync(int empId)
        {
            var leaves = await _uow.Leaves.GetLeavesByEmployeeAsync(empId);
            return _mapper.Map<IEnumerable<LeaveResponseDto>>(leaves);
        }

        public async Task<IEnumerable<LeaveResponseDto>> GetPendingAsync()
        {
            var leaves = await _uow.Leaves.GetPendingLeavesAsync();
            return _mapper.Map<IEnumerable<LeaveResponseDto>>(leaves);
        }
    }
}
