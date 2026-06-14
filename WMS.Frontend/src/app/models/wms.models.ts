// Auth Models
export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  employeeId: number;
  expiry: string;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}

// Department Models
export interface DepartmentDto {
  departmentId?: number;
  departmentName: string;
  description?: string;
}

// Role Models
export interface Role {
  roleId?: number;
  roleName: string;
  description?: string;
}

// Client Models
export interface ClientDto {
  clientId?: number;
  clientName: string;
  clientAddress?: string;
  clientPhoneNumber?: number;
  clientLocation?: string;
  status: boolean;
}

// Project Models
export interface ProjectDto {
  projectId?: number;
  projectName: string;
  clientId?: number;
  clientName?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

export interface AssignEmployeeProjectDto {
  empId: number;
  projectId: number;
  assignedOn: string;
  createdBy: string;
}

export interface EmployeeProjectResponseDto {
  allocationId: number;
  empId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  assignedOn: string;
  status: boolean;
  createdBy: string;
  updatedBy?: string;
  updatedDate?: string;
}

// Employee Models
export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender?: string; // "M", "F", or "O"
  dob: string;
  doj: string;
  departmentId?: number;
  roleId?: number;
  username: string;
  password?: string;
}

export interface EmployeeResponseDto {
  employeeId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender?: string;
  dob: string;
  doj: string;
  departmentName?: string;
  roleName?: string;
  status: string; // "Active", "Inactive"
  createdOn: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: string;
  departmentId?: number;
  roleId?: number;
  status?: string;
}

// Attendance Models
export interface CheckInDto {
  empId: number;
  workMode?: string; // "Work From Office", "Work From Home", etc.
}

export interface AttendanceResponseDto {
  attendanceId: number;
  empId: number;
  employeeName: string;
  checkIn: string;
  checkOut?: string;
  totalHours?: number;
  workMode?: string;
  attendanceDate: string;
}

// Leave Models
export interface ApplyLeaveDto {
  empId: number;
  leaveType: string;
  reason?: string;
  fromDate: string;
  toDate: string;
}

export interface LeaveResponseDto {
  leaveId: number;
  empId: number;
  employeeName: string;
  leaveType: string;
  reason?: string;
  fromDate: string;
  toDate: string;
  status: string; // "Pending", "Approved", "Rejected"
  appliedOn: string;
  approvedBy?: number;
  approvedOn?: string;
}

export interface UpdateLeaveStatusDto {
  status: string; // "Approved" or "Rejected"
  approvedBy: number;
}

// Profile Models
export interface ProfileDto {
  employeeId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender?: string;
  dob: string;
  doj: string;
  departmentName?: string;
  roleName?: string;
  status: string;
  username: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: string;
}

// Announcement Models
export interface AnnouncementDto {
  announcementId: number;
  title: string;
  message: string;
  audience: string; // "All", "Employee", "Manager"
  createdBy: number;
  createdOn: string;
  isActive: boolean;
}

export interface CreateAnnouncementDto {
  title: string;
  message: string;
  audience: string;
  createdBy: number;
}

// AuditLog Models
export interface AuditLogDto {
  auditId: number;
  entityName?: string;
  recordId?: number;
  action?: string;
  createdBy?: number;
  createdOn: string;
}

// Dashboard Models
export interface DashboardSummaryDto {
  totalEmployees: number;
  activeEmployees: number;
  todayCheckIns: number;
  pendingLeaves: number;
  activeProjects: number;
  totalDepartments: number;
  totalClients: number;
}
