from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import Depends, FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

# Load the data ONCE when the server starts (fast, stays in memory)
DATA = Path(__file__).resolve().parent.parent / "data" / "sales.parquet"
df = pd.read_parquet(DATA)

app = FastAPI(title="Burger Town Analytics API")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


def filtered(
    start: Optional[str] = None,
    end: Optional[str] = None,
    outlet: Optional[str] = None,
    group: Optional[str] = None,
    order_type: Optional[str] = None,
):
    """Apply the user's filters. Multi-select values arrive as 'a,b,c'."""
    d = df
    if start:
        d = d[d["Date"] >= start]
    if end:
        d = d[d["Date"] <= end]
    if outlet:
        d = d[d["Outlet_Name"].isin(outlet.split(","))]
    if group:
        d = d[d["Group"].isin(group.split(","))]
    if order_type:
        d = d[d["Order_Type"].isin(order_type.split(","))]
    return d


@app.get("/api/filters")
def get_filters():
    """Values for the dropdowns."""
    return {
        "outlets": sorted(df["Outlet_Name"].unique().tolist()),
        "groups": sorted(df["Group"].unique().tolist()),
        "order_types": sorted(df["Order_Type"].unique().tolist()),
        "min_date": df["Date"].min(),
        "max_date": df["Date"].max(),
    }


@app.get("/api/kpis")
def kpis(d: pd.DataFrame = Depends(filtered)):
    revenue = float(d["Revenue"].sum())
    orders = int(d["BillNo"].nunique())  # orders = distinct bills, NOT rows
    return {
        "records": int(len(d)),
        "revenue": revenue,
        "orders": orders,
        "items": int(d["Quantity"].sum()),
        "aov": revenue / orders if orders else 0,
    }


@app.get("/api/trend")
def trend(d: pd.DataFrame = Depends(filtered)):
    out = d.groupby("Month")["Revenue"].sum().reset_index()
    return out.to_dict("records")


@app.get("/api/by-outlet")
def by_outlet(d: pd.DataFrame = Depends(filtered)):
    out = d.groupby("Outlet_Name")["Revenue"].sum().reset_index()
    return out.sort_values("Revenue", ascending=False).to_dict("records")


@app.get("/api/by-group")
def by_group(d: pd.DataFrame = Depends(filtered)):
    out = d.groupby("Group")["Revenue"].sum().reset_index()
    return out.sort_values("Revenue", ascending=False).to_dict("records")


@app.get("/api/top-items")
def top_items(d: pd.DataFrame = Depends(filtered)):
    out = d.groupby("Item")["Revenue"].sum().reset_index()
    return out.nlargest(10, "Revenue").to_dict("records")

@app.get("/api/export")
def export_csv(d: pd.DataFrame = Depends(filtered)):
    """Download the filtered data, summarised per day / outlet / category / order type."""
    out = (
        d.groupby(["Date", "Outlet_Name", "Group", "Order_Type"])
        .agg(Revenue=("Revenue", "sum"), Orders=("BillNo", "nunique"), Items=("Quantity", "sum"))
        .reset_index()
    )
    return Response(
        out.to_csv(index=False),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_export.csv"},
    )