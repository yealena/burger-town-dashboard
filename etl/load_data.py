import pandas as pd

print("Reading Excel (takes about 25 seconds)...")
df = pd.read_excel("data/sales.xlsx")
print("Rows loaded:", len(df))

# Make sure the date column is a real date
df["Order_Datetime"] = pd.to_datetime(df["Order_Datetime"])

# Remove rows with missing important values
df = df.dropna(subset=["BillNo", "Order_Datetime", "Price", "Quantity"])

# Revenue of each line = price x quantity
df["Revenue"] = df["Price"] * df["Quantity"]

# Helpful date columns for charts and filters
df["Date"] = df["Order_Datetime"].dt.strftime("%Y-%m-%d")
df["Month"] = df["Order_Datetime"].dt.strftime("%Y-%m")
df["Hour"] = df["Order_Datetime"].dt.hour

# Save as a fast file
df.to_parquet("data/sales.parquet", index=False)
print("Saved data/sales.parquet")
print("Total revenue:", df["Revenue"].sum())
print("Unique orders:", df["BillNo"].nunique())