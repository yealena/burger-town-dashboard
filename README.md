# Burger Town Analytics Dashboard

A full-stack business analytics dashboard built to transform a 300,000-row restaurant transaction dataset into an interactive, fast, and deployable analytics application.

## Live Application

**Dashboard:** https://burger-town-dashboard.vercel.app/

**Backend API:** https://burger-town-api.onrender.com/

**GitHub:** https://github.com/yealena/burger-town-dashboard

---

## Project Overview

The source dataset contains approximately 300,000 line-item transaction records. A single order can contain multiple rows, identified by `BillNo`.

The application transforms this raw transactional data into an interactive business intelligence dashboard for monitoring revenue, orders, items sold, outlet performance, category performance, and top-selling products.

The dashboard supports filtering by:

- Date range
- Outlet
- Category
- Order type

It also provides CSV export for filtered data.

---

## Key Features

### KPI Summary

The dashboard provides:

- Total records
- Total revenue
- Unique orders
- Items sold
- Average order value

### Interactive Visualizations

- Monthly revenue trend
- Revenue by outlet
- Revenue by category
- Top 10 items by revenue

### Filtering

Users can dynamically filter the dashboard using:

- Date range
- Outlet
- Category
- Order type

All KPI values and visualizations update based on the selected filters.

### Data Export

Filtered dashboard data can be exported as CSV for further analysis.

---

## Architecture

```text
                    Raw Excel Dataset
                         │
                         ▼
                  ETL / Data Loading
                    load_data.py
                         │
                         ▼
                   Parquet Dataset
                    sales.parquet
                         │
                         ▼
                  Python Backend API
                         │
                         ▼
                    REST API
                         │
                         ▼
              React + Vite Frontend
                    Dashboard UI
                         │
                         ▼
                       Vercel
