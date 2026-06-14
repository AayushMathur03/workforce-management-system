-- Clean up broken admin data so we can create fresh via Swagger
-- This deletes the corrupted hash UserLogin first, then the employee

DELETE FROM UserLogins WHERE Username = 'admin';
DELETE FROM Employees WHERE Email = 'admin@wms.com';

-- Verify cleanup
SELECT COUNT(*) AS EmployeeCount FROM Employees WHERE Email = 'admin@wms.com';
SELECT COUNT(*) AS LoginCount FROM UserLogins WHERE Username = 'admin';
