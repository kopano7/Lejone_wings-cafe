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
              {inv.Product_Name || inv.Product_Code} — {inv.Type} — {inv.Quantity}
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

      {/* Available Products Table */}
      <div className="report-card">
        <h3>Available Products</h3>
        <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Quantity Available</th>
            </tr>
          </thead>
          <tbody>
            {report.availableProducts?.map((p, idx) => (
              <tr key={idx}>
                <td>{p.Product_Name}</td>
                <td>{p.Quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Products Sold by Weeks Table */}
      <div className="report-card">
        <h3>Products Sold by Weeks</h3>
        {report.weeklyTopSelling.map((week, idx) => (
          <div key={idx} style={{ marginBottom: "20px" }}>
            <h4>Week {week.week}</h4>
            <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity Sold</th>
                </tr>
              </thead>
              <tbody>
                {week.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.Product_Name}</td>
                    <td>{item.Quantity_Sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reports;

