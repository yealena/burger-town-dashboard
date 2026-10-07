import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const COLORS = ["#e11d48", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];
const num = (n) => Math.round(n || 0).toLocaleString("en-IN");

function Select({ label, value, options, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export default function App() {
  const [options, setOptions] = useState(null);
  const [f, setF] = useState({ start: "", end: "", outlet: "", group: "", order_type: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  // 1) load dropdown options once
  useEffect(() => {
    fetch(`${API}/api/filters`).then((r) => r.json()).then((o) => {
      setOptions(o);
      setF((p) => ({ ...p, start: o.min_date, end: o.max_date }));
    });
  }, []);

  // 2) reload all numbers whenever a filter changes
  useEffect(() => {
    if (!f.start) return;
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    setLoading(true);
    Promise.all(
      ["kpis", "trend", "by-outlet", "by-group", "top-items"].map((p) =>
        fetch(`${API}/api/${p}?${qs}`).then((r) => r.json())
      )
    ).then(([kpis, trend, outlet, group, items]) => {
      setData({ kpis, trend, outlet, group, items });
      setLoading(false);
    });
  }, [f]);

  if (!options || !data) return <div className="wrap">Loading dashboard...</div>;
  const k = data.kpis;
  const exportUrl = `${API}/api/export?${new URLSearchParams(Object.entries(f).filter(([, v]) => v))}`;
  return (
    <div className="wrap">
      <h1>🍔 Burger Town Analytics {loading && <small>(updating...)</small>}</h1>

      <div className="filters">
        <label>From<input type="date" value={f.start} min={options.min_date} max={options.max_date} onChange={(e) => set("start")(e.target.value)} /></label>
        <label>To<input type="date" value={f.end} min={options.min_date} max={options.max_date} onChange={(e) => set("end")(e.target.value)} /></label>
        <Select label="Outlet" value={f.outlet} options={options.outlets} onChange={set("outlet")} />
        <Select label="Category" value={f.group} options={options.groups} onChange={set("group")} />
        <Select label="Order type" value={f.order_type} options={options.order_types} onChange={set("order_type")} />
                <a className="export-btn" href={exportUrl}>⬇ Export CSV</a>
        
      </div>

      <div className="kpis">
        {[
          ["Records", num(k.records)],
          ["Revenue", "₹" + num(k.revenue)],
          ["Orders", num(k.orders)],
          ["Items sold", num(k.items)],
          ["Avg order value", "₹" + num(k.aov)],
        ].map(([l, v]) => (
          <div className="card" key={l}>
            <div className="kpi-label">{l}</div>
            <div className="kpi-value">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="card">
          <h3>Monthly revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Month" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => v / 1e6 + "M"} />
              <Tooltip formatter={(v) => "₹" + num(v)} />
              <Line type="monotone" dataKey="Revenue" stroke="#e11d48" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Revenue by outlet</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.outlet}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Outlet_Name" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => v / 1e6 + "M"} />
              <Tooltip formatter={(v) => "₹" + num(v)} />
              <Bar dataKey="Revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Revenue by category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.group} dataKey="Revenue" nameKey="Group" outerRadius={90} label>
                {data.group.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => "₹" + num(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Top 10 items by revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.items} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={11} tickFormatter={(v) => v / 1e6 + "M"} />
              <YAxis type="category" dataKey="Item" fontSize={11} width={130} />
              <Tooltip formatter={(v) => "₹" + num(v)} />
              <Bar dataKey="Revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}