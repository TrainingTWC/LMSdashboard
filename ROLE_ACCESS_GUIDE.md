# Role-Based Access Control Guide

## Overview
The Employee Training Dashboard supports role-based access control with a **single unified URL parameter**: `?id=`

The system automatically detects the role based on the ID provided:

1. **Admin View** (No ID parameter - Full Dashboard)
2. **Trainer View** (ID in store mapping as Trainer)
3. **Area Manager View** (ID in store mapping as AM)
4. **Store Manager View** (ID has direct reports)
5. **Employee View** (ID matches an employee code)

---

## Correct Role Structure

### Role Detection Priority

If an ID matches multiple roles, the system uses this priority order:

1. **Trainer** (Highest Priority - Store-level trainer)
2. **Area Manager** (Store-level area manager)
3. **Store Manager** (Has direct reports)
4. **Employee** (Regular employee)
5. **Admin** (Default - No ID or ID not found)

---

## Access Levels

### 1. Admin View
**Access:** No URL parameters required

**Features:**
- Full dashboard with all analytics
- Course completion charts
- Employee performance tracking
- Regional and store-level analytics
- Multi-select filters for all dimensions

**URL:** 
```
https://trainingtwc.github.io/LMSdashboard/
```

---

### 2. Trainer View
**Access:** Use `?id=TRAINER_CODE`

**Features:**
- **Store-based access control**
- See all employees in stores where they are assigned as Trainer
- Team statistics and performance metrics
- Employee list with course details by store
- Store assignment visibility

**URL Example:**
```
?id=H3365
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?id=H3365
```

**Detection:** System checks if the ID exists in `storeMapping.ts` as:
- Trainer field

**Data Scope:** All employees in stores where `Trainer` field matches the ID

---

### 3. Area Manager View
**Access:** Use `?id=AM_CODE`

**Features:**
- **Store-based access control**
- See all employees in stores where they are assigned as Area Manager (AM)
- Team statistics and performance metrics
- Employee list with course details by store
- Store assignment visibility
- Same view as Trainer but labeled as "Area Manager"

**URL Example:**
```
?id=H1355
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?id=H1355
```

**Detection:** System checks if the ID exists in `storeMapping.ts` as:
- AM (Area Manager) field

**Data Scope:** All employees in stores where `AM` field matches the ID

---

### 4. Store Manager View
**Access:** Use `?id=MANAGER_CODE`

**Features:**
- **Team-based access control**
- Shows direct team members (people reporting to them)
- Team aggregate statistics
- Expandable employee cards with course details
- Performance color coding:
  - 🟢 Green: ≥80% completion
  - 🟡 Yellow: 60-79% completion
  - 🔴 Red: <60% completion

**URL Example:**
```
?id=H2295
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?id=H2295
```

**Detection:** System checks if any employee has this ID as their `reporting_manager_code`.

**Data Scope:** All employees who report directly or indirectly to this manager

---

### 5. Employee View
**Access:** Use `?id=EMPLOYEE_CODE`

**Features:**
- Personal training dashboard
- Individual course progress
- Completion statistics
- Course details grouped by category
- Personal profile information

**URL Example:**
```
?id=p2039
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?id=p2039
```

**Detection:** System checks if the ID exists as an `employee_code` in the data.

**Data Scope:** Only their own course completion records

---

## Role Hierarchy & Access Matrix

| Role | Example IDs | Access Level | Stores Visible | Data Scope |
|------|-------------|--------------|----------------|------------|
| **Trainer** | H3365, H3595, H2595, H3252, H1278, H3247 | Store-specific | Assigned stores only (Trainer field) | Employees in assigned stores |
| **Area Manager** | H1355, H546, H3270, H2155, H2601, H833, H535, H955, H1766, H2396, H3386, H2908, H2758, H2262, H1575, H2273, H3362, H1972, H3247 | Store-specific | Assigned stores only (AM field) | Employees in assigned stores |
| **Store Manager** | H2295 (and others with direct reports) | Team-based | All stores with their team members | Direct and indirect reports |
| **Employee** | p2039 (and others) | Individual | Their store | Only their own data |

---

## Use Cases

### Scenario 1: Employee wants to check personal progress
**Action:** Navigate to `?id=p2039`
**Result:** Personal dashboard with individual course progress and completion stats

---

### Scenario 2: Store Manager wants to see their team
**Action:** Navigate to `?id=H2295`
**Result:** Sees all direct reports (Baristas, Shift Supervisors) and their completion status

---

### Scenario 3: Trainer wants to check stores they manage
**Action:** Navigate to `?id=H3365`
**Result:** Sees all employees from stores where they are assigned as Trainer (South region stores)

---

### Scenario 4: Area Manager wants to review their stores
**Action:** Navigate to `?id=H1355`
**Result:** Sees all employees from stores where they are assigned as Area Manager

---

### Scenario 5: Admin wants full dashboard analytics
**Action:** Navigate to base URL (no parameters)
**Result:** Full admin dashboard with all charts, filters, and analytics

---

## Data Source

All role views use the **same data source**: `lms-completion.json` (merged data)

The data is merged with store mapping information to enable:
- Store-based filtering for trainers
- Regional analytics
- Area manager hierarchies
- Location-based reporting

---

## Technical Implementation

### Data Flow:
1. **URL Parameter Detection**: App.tsx checks for single `?id=` parameter
2. **Role Detection**: `detectRole()` function checks in priority order:
   - Is ID a Trainer? (exists in `storeMapping.ts` Trainer field)
   - Is ID an Area Manager? (exists in `storeMapping.ts` AM field)
   - Is ID a Store Manager? (exists in `reporting_manager_code`)
   - Is ID an Employee? (exists in `employee_code`)
3. **Priority Resolution**: If ID matches multiple roles, uses priority order (Trainer > Area Manager > Store Manager > Employee)
4. **View Rendering**: Renders appropriate view component
5. **Data Filtering**: Each view filters data according to role permissions

### File Structure:
```
components/
  ├── TrainerView.tsx      (Trainer and Area Manager view)
  ├── ManagerView.tsx      (Store Manager hierarchical view)
  ├── EmployeeView.tsx     (Individual employee view)
  └── TabbedDashboard.tsx  (Admin full dashboard)

data/
  └── storeMapping.ts      (Store and role mappings)

types.ts                   (Type definitions)
App.tsx                    (Main routing with role detection)
```

### Role Detection Function:
```typescript
const detectRole = (id: string, data: any[]): 'employee' | 'manager' | 'trainer' | null => {
  // Check if ID exists as Trainer in store mapping
  const isTrainer = storeMappingData.some(store => store.Trainer === id);
  
  // Check if ID exists as Area Manager (AM) in store mapping
  const isAreaManager = storeMappingData.some(store => store.AM === id);
  
  // Check if ID has people reporting to them (store manager)
  const isManager = data.some(record => record.reporting_manager_code === id);
  
  // Check if ID exists as an employee
  const isEmployee = data.some(record => record.employee_code === id);
  
  // Priority: Trainer > Area Manager > Store Manager > Employee
  if (isTrainer || isAreaManager) return 'trainer';
  if (isManager) return 'manager';
  if (isEmployee) return 'employee';
  
  return null;
};
```

### Data Filtering by Role:

**Trainers & Area Managers:**
```typescript
// Get stores where user is Trainer or AM
const stores = storeMappingData.filter(s => 
  s.Trainer === userId || s.AM === userId
);
const storeIds = stores.map(s => s['Store ID']);

// Filter data for those stores
const filteredData = data.filter(r => 
  storeIds.includes(r['Store ID'])
);
```

**Store Managers:**
```typescript
// Find all direct and indirect reports recursively
const findAllSubordinates = (managerId) => {
  data.forEach(record => {
    if (record.reporting_manager_code === managerId) {
      allReports.add(record.employee_code);
      findAllSubordinates(record.employee_code);
    }
  });
};
```

**Employees:**
```typescript
// Filter to only their own records
const filteredData = data.filter(r => 
  r.employee_code === userId
);
```

---

## Error Handling

### ID Not Found
If the provided ID doesn't match any role, the system will:
1. Show a warning message: "The ID 'XXXXX' was not found in the system"
2. Display the full admin dashboard below the warning
3. Allow the user to verify and correct the ID

### Missing Data Fields
If required data fields are missing:
- **Manager View**: Requires `reporting_manager_code` field
- **Trainer View**: Requires `Store ID` field
- System will show appropriate error messages

---

## Security Notes

⚠️ **Important:** URL parameters are visible and can be manipulated. This system is designed for:
- Internal use within trusted networks
- Quick access without complex authentication
- Training management and self-service reporting

For production environments with sensitive data, consider:
- Adding authentication layer
- Server-side access control validation
- Encrypted tokens instead of plain IDs
- Session management

---

## Quick Reference

### Role System

| Role Type | URL Format | Example | Detection Method | Data Access |
|-----------|------------|---------|------------------|-------------|
| Admin | (no parameter) | `https://example.com/` | Default when no ID | All data |
| Trainer | `?id=CODE` | `?id=H3365` | ID in Trainer field of storeMapping | Employees in assigned stores |
| Area Manager | `?id=CODE` | `?id=H1355` | ID in AM field of storeMapping | Employees in assigned stores |
| Store Manager | `?id=CODE` | `?id=H2295` | ID in reporting_manager_code | Direct and indirect reports |
| Employee | `?id=CODE` | `?id=p2039` | ID exists as employee_code | Only their own data |

### Benefits of This System

✅ **Clear Hierarchy**: Trainers > Area Managers > Store Managers > Employees  
✅ **Store-Based Access**: Trainers and Area Managers see all employees in their stores  
✅ **Team-Based Access**: Store Managers see their direct team members  
✅ **Privacy**: Employees see only their own data  
✅ **Simplicity**: One parameter for all role types  
✅ **Flexibility**: Automatic role detection based on data  

---

## Troubleshooting

### Problem: ID not recognized
**Solution:** 
1. Verify the ID exists in your CSV data
2. Check spelling and case sensitivity (system is case-insensitive but exact match is preferred)
3. Ensure data has been merged with store mapping
4. Check browser console for errors

### Problem: Wrong view showing (e.g., seeing Employee view instead of Trainer view)
**Solution:**
1. Check role detection priority order: Trainer > Area Manager > Store Manager > Employee
2. Verify the ID is correctly listed in storeMapping.ts:
   - For Trainers: Check the "Trainer" field
   - For Area Managers: Check the "AM" field
3. If ID has multiple roles, higher priority role will show
4. Verify store mapping data is up to date

### Problem: No data showing in Trainer/Area Manager View
**Solution:**
1. Ensure CSV includes `Store ID` column
2. Verify store IDs match between employee data and store mapping
3. Check that trainer/AM is assigned to stores in `storeMapping.ts`
4. Confirm data merge was successful

### Problem: Store Manager sees too much data
**Solution:**
1. This is expected behavior - Store Managers see all direct and indirect reports
2. If they should only see direct reports, this needs code modification
3. Verify `reporting_manager_code` is correctly set in employee data

---

## Support

For questions or issues:
1. Check the store mapping in `data/storeMapping.ts`
2. Verify employee data has correct `Store ID` field
3. Ensure CSV merge has been performed for full functionality
4. Verify role assignments in store mapping:
   - Trainer field for trainers
   - AM field for area managers
   - reporting_manager_code for store managers
5. Contact the development team for access issues

---

## Summary of Correct Role Mapping

The four main roles in the system are:

1. **Trainers** - Mapped via "Trainer" field in storeMapping.ts
   - See all employees in stores where they are assigned as Trainer
   - Example: H3365 (South region stores)

2. **Area Managers** - Mapped via "AM" field in storeMapping.ts
   - See all employees in stores where they are assigned as Area Manager
   - Example: H1355 (multiple Bangalore stores)

3. **Store Managers** - Detected via reporting_manager_code in employee data
   - See their direct team members (employees who report to them)
   - Example: H2295 (Baristas and supervisors in their store)

4. **Regular Employees** - All other employee codes
   - See only their own course completion data
   - Example: p2039

---

**Last Updated:** February 14, 2026  
**Version:** 4.0 - Corrected Role Mapping (Trainers, Area Managers, Store Managers, Employees)
