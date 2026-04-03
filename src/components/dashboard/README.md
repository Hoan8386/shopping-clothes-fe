# Dashboard Pages - Setup & Usage Guide

## Overview

This directory contains fully functional dashboard pages for both Admin and Staff users in the Shopping application.

## File Structure

```
src/
├── app/
│   ├── (admin)/
│   │   └── dashboard/
│   │       ├── layout.tsx           # Admin dashboard layout
│   │       └── page.tsx             # Admin dashboard main page
│   └── (staff)/
│       └── dashboard/
│           ├── layout.tsx           # Staff dashboard layout
│           └── page.tsx             # Staff dashboard main page
├── components/
│   └── dashboard/
│       ├── stat-card.tsx            # KPI metric card component
│       ├── chart-bar.tsx            # Bar chart visualization
│       ├── table-top-products.tsx   # Top products table
│       ├── table.tsx                # Generic table component
│       ├── loading-skeleton.tsx     # Loading state components
│       └── error-alert.tsx          # Error display components
└── services/
    └── dashboard.service.ts          # Centralized API service
```

## Features

### Admin Dashboard

- **Overview Metrics**: Revenue, Orders, Customers, Employees, Inventory
- **Revenue Charts**: Revenue and order count trends (by day/week/month)
- **Top Products**: Best-selling products with revenue and profit margins
- **Customer Analytics**: Top customers by spending
- **Employee Performance**: Top employees by sales
- **Store Performance**: Revenue by store location
- **Return/Exchange Statistics**: Return and exchange rates

### Staff Dashboard

- **Personal Overview**: Today's orders, sales, monthly targets
- **Sales Performance**: Individual sales trends with charts
- **Salary Breakdown**: Base salary + bonuses + commissions
- **Weekly Performance**: Weekly KPIs and top-performing products
- **Pending Orders**: Orders awaiting staff action
- **Work Schedule**: Upcoming shifts and schedules

## Backend API Integration

All dashboard data is fetched via REST APIs:

### Admin Dashboard APIs

```
GET /api/admin/dashboard/overview?period={day|week|month}
GET /api/admin/dashboard/top-products?limit=10&period={day|week|month}
GET /api/admin/dashboard/revenue-stats?period={day|week|month}
GET /api/admin/dashboard/customers?period={day|week|month}
GET /api/admin/dashboard/employees?period={day|week|month}
GET /api/admin/dashboard/stores?period={day|week|month}
GET /api/admin/dashboard/returns-exchanges?period={day|week|month}
```

### Staff Dashboard APIs

```
GET /api/staff/dashboard/overview?employeeId={id}
GET /api/staff/dashboard/schedule?employeeId={id}
GET /api/staff/dashboard/sales-performance?employeeId={id}&period={day|week|month}
GET /api/staff/dashboard/salary?employeeId={id}
GET /api/staff/dashboard/pending-orders?employeeId={id}
GET /api/staff/dashboard/weekly-performance?employeeId={id}
GET /api/staff/dashboard/upcoming-schedule?employeeId={id}
```

## Setup Instructions

### 1. Environment Variables

Create or update `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 2. Required Backend Services

Ensure the following Spring Boot services are running:

- `/api/admin/dashboard/*` endpoints
- `/api/staff/dashboard/*` endpoints
- All dependent repositories configured

### 3. Database Requirements

Ensure the following tables exist and have data:

- `don_hang` (orders)
- `chi_tiet_don_hang` (order details)
- `khach_hang` (customers)
- `nhan_vien` (employees)
- `san_pham` (products)
- `cua_hang` (stores)
- `lich_lam_viec` (work schedules)
- `luong_coban` (base salary)
- `luong_thuong` (bonuses)

## Usage

### Admin Access

```
http://localhost:3000/dashboard
```

### Staff Access

```
http://localhost:3000/dashboard?employeeId={employee_id}
```

## Component Usage

### StatCard

Display KPI metrics with optional trend indicators:

```tsx
<StatCard
  title="Doanh thu"
  value="1,234,567"
  trend={15}
  trendUp={true}
  bgColor="bg-blue-50"
/>
```

### BarChart

Render bar chart visualizations:

```tsx
<BarChart
  title="Doanh thu theo tháng"
  data={[
    { label: "Tháng 1", value: 1000000, color: "bg-blue-500" },
    { label: "Tháng 2", value: 1500000, color: "bg-green-500" },
  ]}
  maxHeight={300}
/>
```

### Table

Generic table component for displaying data:

```tsx
<Table
  title="Top 5 Khách hàng"
  columns={[
    { key: "customerName", label: "Tên khách hàng" },
    { key: "totalSpent", label: "Tổng tiêu", format: (v) => formatCurrency(v) },
  ]}
  data={customers}
  isLoading={isLoading}
/>
```

## Features & Best Practices

### Data Fetching

- Uses centralized `dashboardService` for all API calls
- Supports error bounds and retry mechanisms
- Auto-refreshes data when period parameter changes

### Loading States

- Skeleton loaders for smooth UX during data fetch
- Placeholder cards prevent layout shift
- Progressive loading of different data sections

### Error Handling

- User-friendly error messages in Vietnamese
- Retry button on error states
- Graceful degradation if some APIs fail

### Performance

- Lazy loading of tables and charts
- Conditional rendering prevents unnecessary DOM rendering
- Chart data aggregated server-side for efficiency

### Responsive Design

- Mobile-first approach with Tailwind CSS
- Grid layouts adjust from 1 → 2 → 4 columns on larger screens
- Tables have horizontal scroll on mobile devices

## Customization

### Adding New Metrics

1. Update backend service to include new calculation
2. Add new DTO field in response interface
3. Create new StatCard in dashboard page
4. Add corresponding column/chart data

### Changing Time Periods

Modify `period` state and available options:

```tsx
const [period, setPeriod] = useState<
  "day" | "week" | "month" | "quarter" | "year"
>("month");
```

### Styling

- Uses Tailwind CSS v4 with custom utilities
- Theme colors: blue (primary), green (success), red (danger), orange (warning)
- Update color schemes in individual components as needed

## Troubleshooting

### "Failed to fetch" errors

- Verify backend API is running
- Check NEXT_PUBLIC_API_URL in environment
- Confirm CORS is enabled on backend

### Empty tables

- Verify employeeId is passed for staff dashboard
- Check database contains sample data
- Review backend service for filtering logic

### Styling issues

- Clear Next.js cache: `rm -rf .next`
- Restart development server
- Verify Tailwind CSS configuration

## Testing Checklist

- [ ] Admin dashboard loads with all metrics
- [ ] Period selector updates charts
- [ ] Staff dashboard loads with employeeId parameter
- [ ] All tables display data correctly
- [ ] Currency formatting shows VND
- [ ] Error state displays retry button
- [ ] Loading skeletons appear on initial load
- [ ] Responsive layout on mobile devices
- [ ] Charts render properly with data
- [ ] Salary breakdown matches backend calculation

## Support

For issues or feature requests, please reference:

- Backend API documentation: `/document/`
- Component prop interfaces: See component files
- API service: `src/services/dashboard.service.ts`
