# 📊 Employee Training Dashboard

A comprehensive training analytics dashboard with role-based access control for employees, store managers, area managers, trainers, and administrators.

🔗 **Live Dashboard:** https://trainingtwc.github.io/LMSdashboard/

## ✨ Features

### 🎯 Role-Based Access Control
- **Admin View**: Full dashboard with all analytics and filters
- **Trainer View**: Store-based access - see all employees in assigned stores
- **Area Manager View**: Store-based access - see all employees in assigned stores
- **Store Manager View**: Team-based access - see direct and indirect reports
- **Employee View**: Personal training progress and course details

### 📈 Analytics & Insights
- Course completion tracking
- Performance categorization (High Performers, Average, Needs Attention)
- Regional and store-level analytics
- Tenure-based analysis
- Designation and department breakdowns
- Interactive charts and visualizations

### 🎨 User Experience
- Mobile-responsive design
- Dark/Light theme toggle
- Collapsible filters for mobile
- Real-time data updates
- Export functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TrainingTWC/LMSdashboard.git
   cd LMSdashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## 📚 Access Control Guide

### URL Parameters

Access different views using a single URL parameter `?id=`:

| View Type | Example | Description |
|-----------|---------|-------------|
| Admin | `https://trainingtwc.github.io/LMSdashboard/` | Full dashboard (no parameter) |
| Trainer | `?id=H3365` | See employees in assigned stores |
| Area Manager | `?id=H1355` | See employees in assigned stores |
| Store Manager | `?id=H2295` | See direct team members |
| Employee | `?id=p2039` | Personal progress only |

### Role Hierarchy

The system automatically detects roles with this priority:

1. **Trainer** (Highest) - Assigned via "Trainer" field in store mapping
2. **Area Manager** - Assigned via "AM" field in store mapping
3. **Store Manager** - Has direct reports in employee data
4. **Employee** - Regular employee code

| Role | Example ID | Access Level |
|------|------------|-------------|
| Trainer | H3365 | Employees in stores where assigned as Trainer |
| Area Manager | H1355 | Employees in stores where assigned as AM |
| Store Manager | H2295 | Direct and indirect team members |
| Employee | p2039 | Only own data |

📖 **Full Documentation:** See [ROLE_ACCESS_GUIDE.md](./ROLE_ACCESS_GUIDE.md)

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Data Processing:** d3-dsv
- **Deployment:** GitHub Pages

## 📁 Project Structure

```
├── components/
│   ├── TrainerView.tsx       # Trainer role-based view
│   ├── ManagerView.tsx       # Hierarchical manager view
│   ├── EmployeeView.tsx      # Individual employee view
│   ├── Dashboard.tsx         # Main analytics dashboard
│   └── [Other components]
├── data/
│   └── storeMapping.ts       # Store and role mapping
├── services/
│   ├── dataPersistenceService.ts
│   └── githubUploadService.ts
├── scripts/
│   └── updateStoreMapping.js # Store data update script
└── types.ts                  # TypeScript type definitions
```

## 🔐 Admin Features

Admin panel includes:
- Data upload and management
- GitHub integration for data persistence
- Configuration management
- User session management

Access admin panel: Click the lock icon when viewing the dashboard

## 📊 Data Format

Upload CSV files with the following structure:

```csv
employee_code,employee_name,designation,department,course_name,course_category,course_completion_status,date_of_joining,Store ID
EMP001,John Doe,Barista,Operations,Food Safety 101,Safety,Completed,2024-01-15,S001
```

For enhanced analytics, include `Store ID` column to enable:
- Regional analysis
- Store performance tracking
- Trainer-specific views
- Area manager insights

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support:
- 📧 Contact the development team
- 🐛 [Open an issue](https://github.com/TrainingTWC/LMSdashboard/issues)
- 📖 Check the [Role Access Guide](./ROLE_ACCESS_GUIDE.md)

## 🎯 Roadmap

- [ ] Advanced filtering options
- [ ] Email notifications
- [ ] Mobile app
- [ ] Real-time LMS integration
- [ ] Authentication with Azure AD
- [ ] Export to PDF/Excel

---

**Version:** 2.0 - Role-Based Access Control  
**Last Updated:** October 24, 2025
