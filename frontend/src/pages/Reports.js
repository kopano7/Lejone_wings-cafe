import React, { useEffect, useState } from "react";

function Reports() {
  const [report, setReport] = useState(null);

  const fetchReport = async () => {
    try {
      const res = await fetch("https://lejone-wings-cafe-2.onrender.com/api/reports");
      if (!res.ok) throw new Error("Failed to fetch report");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  };

  useEffect(() => {
    fetchReport();

    const interval = setInterval(fetchReport, 5000);
    const handleSaleCompleted = () => fetchReport();
    window.addEventListener("saleCompleted", handleSaleCompleted);

    return () => {
      clearInterval(interval);
      window.removeEventListener("saleCompleted", handleSaleCompleted);
    };
  }, []);

  if (!report) return <p>Loading reports...</p>;

  return (
    <div className="report-container">
      {/* Sales Summary by Weeks */}
      <div className="report-card">
        <h3>Weekly Sales Summary</h3>
        <ul>
          {report.weeklyRevenue.map((week, idx) => (
            <li key={idx}>
              <strong>Week {week.week}</strong>: {week.revenue.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>

      {/* Top Selling by Weeks */}
      <div className="report-card">
        <h3>Weekly Top Selling</h3>
        {report.weeklyTopSelling.map((week, idx) => (
          <div key={idx} style={{ marginBottom: "10px" }}>
            <h4>Week {week.week}</h4>
            <ul>
              {week.items.map((item) => (
                <li key={item.Product_Code}>
                  {item.Product_Name} — {item.Quantity_Sold}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Inventory Movements */}
      <div className="report-card">
        <h3>Inventory Movements</h3>
        <p>Total inventory records: {report.recentInventory.length}</p>
        <h4>Recent</h4>
        <ul>
          {report.recentInventory.map((inv, idx) => (
            <li key={idx}>
              {inv.Product_Code} — {inv.Type} — {inv.Quantity}
            </li>
          ))}
        </ul>
      </div>

      {/* Low Stock */}
      <div className="report-card">
        <h3>Low Stock</h3>
        {report.lowStock.length === 0 ? (
          <p>No low stock items</p>
        ) : (
          <ul>
            {report.lowStock.map((p) => (
              <li key={p.Product_Code}>
                {p.Product_Name} — {p.Quantity} left
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Reports;
