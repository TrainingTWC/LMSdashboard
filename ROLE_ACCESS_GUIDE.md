# Role-Based Access Control Guide

## Overview
The Employee Training Dashboard now supports role-based access control with four different view types:

1. **Admin View** (Full Dashboard)
2. **Employee View** (Individual employee data)
3. **Manager View** (Team hierarchy data)
4. **Trainer View** (Store-based access control)

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

### 2. Employee View
**Access:** Use `employee_id`, `emp_id`, or `id` URL parameter

**Features:**
- Personal training dashboard
- Individual course progress
- Completion statistics
- Course details grouped by category
- Personal profile information

**URL Examples:**
```
?employee_id=EMP001
?emp_id=EMP001
?id=EMP001
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?employee_id=EMP001
```

---

### 3. Manager View
**Access:** Use `manager_id`, `mgr_id`, or `manager` URL parameter

**Features:**
- **Hierarchical team view** (recursive)
- Shows all direct reports
- Shows all indirect reports (subordinates of subordinates)
- Team aggregate statistics
- Visual distinction between direct and indirect reports
- Expandable employee cards with course details
- Performance color coding:
  - 🟢 Green: ≥80% completion
  - 🟡 Yellow: 60-79% completion
  - 🔴 Red: <60% completion

**URL Examples:**
```
?manager_id=MGR001
?mgr_id=MGR001
?manager=MGR001
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?manager_id=H2595
```

**How it works:**
- Uses `reporting_manager_code` field to build hierarchy
- Recursively finds all subordinates at all levels
- Example: Area Manager sees Store Managers AND all Baristas/Supervisors

---

### 4. Trainer View (NEW! 🎉)
**Access:** Use `trainer_id`, `trainer`, or `t_id` URL parameter

**Features:**
- **Store-based access control**
- Trainers see only their assigned stores' employees
- **E-Learning Specialist** sees ALL data (full access)
- **Training Head** sees ALL data (full access)
- **HR Head** sees ALL data (full access)
- Team statistics and performance metrics
- Employee list with course details
- Store assignment visibility

**URL Examples:**
```
?trainer_id=H1761
?trainer=H1761
?t_id=H1761
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?trainer_id=H1761
```

---

## Role Hierarchy & Access Matrix

| Role | Trainer ID | Access Level | Stores Visible | Data Scope |
|------|-----------|--------------|----------------|------------|
| **Trainer** | H1761, H701, H1697, etc. | Store-specific | Assigned stores only | Employees in assigned stores |
| **E-Learning Specialist** | H541 | Full access | All stores | All employee data |
| **Training Head** | H3237 | Full access | All stores | All employee data |
| **HR Head** | H2081 | Full access | All stores | All employee data |

---

## Store Mapping Structure

Each store has the following role assignments:
```csv
Store ID, Store Name, Trainer, E-Learning Specialist, Training Head, HR Head
S001, Koramangala, H1761, H541, H3237, H2081
S002, CMH Indira Nagar, H1761, H541, H3237, H2081
S003, HSR-1, H701, H541, H3237, H2081
```

### Trainer Examples:
- **H1761** (Mahadev): Trainer for stores S001, S002, S004, S006, S007, S009, etc.
- **H701** (Mallika): Trainer for stores S003, S008, S015, S016, S017, S018, etc.
- **H1697** (Sheldon): Trainer for stores S005, S011, S020, S022, S023, etc.
- **H3252** (Priyanka): Trainer for stores S043, S048, S058, S059, S060, etc.

### Leadership Roles:
- **H541**: E-Learning Specialist (Full access to ALL stores)
- **H3237**: Training Head (Full access to ALL stores)
- **H2081**: HR Head (Full access to ALL stores)

---

## Use Cases

### Scenario 1: Trainer wants to check their team
**Action:** Navigate to `?trainer_id=H1761`
**Result:** Sees all employees from stores: S001, S002, S004, S006, S007, S009, S012, S014, S021, S031

---

### Scenario 2: E-Learning Specialist needs to review all training
**Action:** Navigate to `?trainer_id=H541`
**Result:** Full access - sees ALL employees across ALL stores with "Full Access" badge

---

### Scenario 3: Training Head wants company-wide insights
**Action:** Navigate to `?trainer_id=H3237`
**Result:** Full access - sees ALL employees across ALL stores with "Full Access" badge

---

### Scenario 4: Area Manager wants to see team hierarchy
**Action:** Navigate to `?manager_id=H2595`
**Result:** Sees all direct reports (Store Managers) AND indirect reports (Baristas, Supervisors) in the region

---

### Scenario 5: Employee wants to check personal progress
**Action:** Navigate to `?employee_id=EMP123`
**Result:** Personal dashboard with individual course progress and completion stats

---

## Technical Implementation

### Data Flow:
1. **URL Parameter Detection**: App.tsx checks for `trainer_id`, `trainer`, or `t_id`
2. **Store Lookup**: TrainerView component queries `storeMapping.ts` for trainer's stores
3. **Access Level Check**: Determines if user is Trainer, E-Learning Specialist, Training Head, or HR Head
4. **Data Filtering**: Filters employee data by Store ID (or shows all if full access)
5. **Display**: Shows employee cards with course details and statistics

### File Structure:
```
components/
  ├── TrainerView.tsx      (New trainer-specific view)
  ├── ManagerView.tsx      (Hierarchical manager view)
  ├── EmployeeView.tsx     (Individual employee view)
  └── TabbedDashboard.tsx  (Admin full dashboard)

data/
  └── storeMapping.ts      (Updated with role hierarchy)

types.ts                   (Updated StoreRecord interface)
App.tsx                    (Updated routing logic)
```

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

## Future Enhancements

Potential additions:
- [ ] Export functionality for trainer reports
- [ ] Email notifications for low performers
- [ ] Trainer-specific course assignment interface
- [ ] Mobile app with QR code access
- [ ] Integration with LMS for real-time data
- [ ] Authentication with Azure AD/SAML

---

## Quick Reference

| View Type | URL Parameter | Example Value | Access Level |
|-----------|---------------|---------------|--------------|
| Admin | None | - | Full dashboard |
| Employee | `employee_id` | EMP001 | Personal data only |
| Manager | `manager_id` | H2595 | Team hierarchy |
| Trainer | `trainer_id` | H1761 | Assigned stores |
| E-Learning | `trainer_id` | H541 | All stores (full access) |
| Training Head | `trainer_id` | H3237 | All stores (full access) |
| HR Head | `trainer_id` | H2081 | All stores (full access) |

---

## Support

For questions or issues:
1. Check the store mapping in `data/storeMapping.ts`
2. Verify employee data has correct `Store ID` field
3. Ensure CSV merge has been performed for full functionality
4. Contact the development team for access issues

---

**Last Updated:** October 24, 2025  
**Version:** 2.0 - Role-Based Access Control
