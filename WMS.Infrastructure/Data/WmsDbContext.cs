using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Data
{
    public class WmsDbContext : DbContext
    {
        public WmsDbContext(DbContextOptions<WmsDbContext> options) : base(options) { }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<Leave> Leaves { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<EmployeeProject> EmployeeProjects { get; set; }
        public DbSet<UserLogin> UserLogins { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Employee unique email
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Email)
                .IsUnique();

            // Employee status index
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Status);

            // UserLogin unique username
            modelBuilder.Entity<UserLogin>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Attendance Date index
            modelBuilder.Entity<Attendance>()
                .HasIndex(a => a.AttendanceDate);

            // Leave Status index
            modelBuilder.Entity<Leave>()
                .HasIndex(l => l.Status);

            // Attendance computed column
            modelBuilder.Entity<Attendance>()
                .Property(a => a.TotalHours)
                .HasComputedColumnSql(
                    "CASE WHEN CheckOut IS NOT NULL THEN DATEDIFF(MINUTE, CheckIn, CheckOut) / 60.0 ELSE NULL END",
                    stored: false);

            // Seed Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, RoleName = "Admin", Description = "System Administrator" },
                new Role { RoleId = 2, RoleName = "Manager", Description = "Department Manager" },
                new Role { RoleId = 3, RoleName = "Employee", Description = "Regular Employee" }
            );

            // Seed Departments
            modelBuilder.Entity<Department>().HasData(
                new Department { DepartmentId = 1, DepartmentName = "Human Resources", Description = "HR Department" },
                new Department { DepartmentId = 2, DepartmentName = "Information Technology", Description = "IT Department" },
                new Department { DepartmentId = 3, DepartmentName = "Finance", Description = "Finance Department" },
                new Department { DepartmentId = 4, DepartmentName = "Operations", Description = "Operations Department" }
            );
        }
    }
}
