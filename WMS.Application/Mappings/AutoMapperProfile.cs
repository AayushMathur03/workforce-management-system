using AutoMapper;
using WMS.Application.DTOs.Announcement;
using WMS.Application.DTOs.Attendance;
using WMS.Application.DTOs.AuditLog;
using WMS.Application.DTOs.Client;
using WMS.Application.DTOs.Department;
using WMS.Application.DTOs.Employee;
using WMS.Application.DTOs.Leave;
using WMS.Application.DTOs.Profile;
using WMS.Application.DTOs.Project;
using WMS.Domain.Entities;

namespace WMS.Application.Mappings
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // Employee
            CreateMap<Employee, EmployeeResponseDto>()
                .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department != null ? s.Department.DepartmentName : null))
                .ForMember(d => d.RoleName, o => o.MapFrom(s => s.Role != null ? s.Role.RoleName : null));

            CreateMap<CreateEmployeeDto, Employee>()
                .ForMember(d => d.UserLogin, o => o.Ignore())
                .ForMember(d => d.EmployeeId, o => o.Ignore());

            CreateMap<UpdateEmployeeDto, Employee>()
                .ForAllMembers(o => o.Condition((src, dest, val) => val != null));

            // Department
            CreateMap<Department, DepartmentDto>().ReverseMap();

            // Attendance
            CreateMap<Attendance, AttendanceResponseDto>()
                .ForMember(d => d.EmployeeName,
                    o => o.MapFrom(s => s.Employee != null
                        ? s.Employee.FirstName + " " + s.Employee.LastName
                        : string.Empty));

            // Leave
            CreateMap<Leave, LeaveResponseDto>()
                .ForMember(d => d.EmployeeName,
                    o => o.MapFrom(s => s.Employee != null
                        ? s.Employee.FirstName + " " + s.Employee.LastName
                        : string.Empty));

            CreateMap<ApplyLeaveDto, Leave>();

            // Project
            CreateMap<Project, ProjectDto>()
                .ForMember(d => d.ClientName,
                    o => o.MapFrom(s => s.Client != null ? s.Client.ClientName : null));
            CreateMap<ProjectDto, Project>()
                .ForMember(d => d.ProjectId, o => o.Ignore())
                .ForMember(d => d.Client, o => o.Ignore())
                .ForMember(d => d.EmployeeProjects, o => o.Ignore());

            // EmployeeProject
            CreateMap<EmployeeProject, EmployeeProjectResponseDto>()
                .ForMember(d => d.EmployeeName,
                    o => o.MapFrom(s => s.Employee != null
                        ? s.Employee.FirstName + " " + s.Employee.LastName
                        : string.Empty))
                .ForMember(d => d.ProjectName,
                    o => o.MapFrom(s => s.Project != null ? s.Project.ProjectName : string.Empty));

            // Client
            CreateMap<Client, ClientDto>();
            CreateMap<ClientDto, Client>()
                .ForMember(d => d.Projects, o => o.Ignore());

            // Announcement
            CreateMap<Announcement, AnnouncementDto>();
            CreateMap<CreateAnnouncementDto, Announcement>()
                .ForMember(d => d.AnnouncementId, o => o.Ignore())
                .ForMember(d => d.CreatedOn, o => o.Ignore())
                .ForMember(d => d.IsActive, o => o.Ignore());
            // Note: Audience is mapped by convention (same property name on both sides)

            // Profile
            CreateMap<Employee, ProfileDto>()
                .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department != null ? s.Department.DepartmentName : null))
                .ForMember(d => d.RoleName, o => o.MapFrom(s => s.Role != null ? s.Role.RoleName : null))
                .ForMember(d => d.Username, o => o.MapFrom(s => s.UserLogin != null ? s.UserLogin.Username : string.Empty));

            CreateMap<UpdateProfileDto, Employee>()
                .ForAllMembers(o => o.Condition((src, dest, val) => val != null));

            // AuditLog
            CreateMap<AuditLog, AuditLogDto>();
        }
    }
}
