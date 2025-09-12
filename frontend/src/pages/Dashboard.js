// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const res = await fetch("https://lejone-wings-cafe-2.onrender.com/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);

      const initCategories = {};
      data.forEach(p => { initCategories[p.Category] = false; });
      setExpandedCategories(initCategories);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch("https://lejone-wings-cafe-2.onrender.com/api/sales");
      if (!res.ok) throw new Error("Failed to fetch sales");
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error("Error fetching sales:", err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch("https://lejone-wings-cafe-2.onrender.com/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSales();
    fetchInventory();

    const interval = setInterval(() => {
      fetchProducts();
      fetchSales();
      fetchInventory();
    }, 5000);

    const handleSaleCompleted = () => {
      fetchSales();
      fetchInventory();
    };
    window.addEventListener("saleCompleted", handleSaleCompleted);

    return () => {
      clearInterval(interval);
      window.removeEventListener("saleCompleted", handleSaleCompleted);
    };
  }, []);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const categories = [...new Set(products.map(p => p.Category))];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard</h2>

      {/* Products */}
      <div>
        <h3>Products</h3>
        {categories.map(cat => (
          <div key={cat}>
            <h4 onClick={() => toggleCategory(cat)} style={{ cursor: "pointer" }}>
              {cat} {expandedCategories[cat] ? "▲" : "▼"}
            </h4>
            {expandedCategories[cat] && (
              <ul>
                {products.filter(p => p.Category === cat).map(p => (
                  <li key={p.Product_Code}>
                    {p.Product_Name} — Stock: {p.Quantity} — Price: {p.Price}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Sales */}
      <div>
        <h3>Recent Sales</h3>
        <ul>
          {sales.slice(-5).map(s => (
            <li key={s.Sale_Code}>
              {s.Customer_Name || "Guest"} — Total: {s.Total} — Date: {new Date(s.Date).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>

      {/* Inventory */}
      <div>
        <h3>Inventory</h3>
        <ul>
          {inventory.slice(-5).map(i => (
            <li key={i.Inventory_Code}>
              {i.Product_Code} — {i.Type} — {i.Quantity} — {new Date(i.Date).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
