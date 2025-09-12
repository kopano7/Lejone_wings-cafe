import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);

  const navigate = useNavigate();

  // store refs for each category card
  const categoryRefs = useRef({});

  useEffect(() => {
    fetch("https://lejone-wings-cafe-2.onrender.com/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);

        // ✅ Auto-expand the first category when products are loaded
        if (data.length > 0) {
          const firstCategory = data[0].Category;
          setExpandedCategories([firstCategory]);

          // ✅ Scroll to the first category after small delay
          setTimeout(() => {
            if (categoryRefs.current[firstCategory]) {
              categoryRefs.current[firstCategory].scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 300);
        }
      });

    fetch("https://lejone-wings-cafe-2.onrender.com/api/sales")
      .then((res) => res.json())
      .then(setSales);

    fetch("https://lejone-wings-cafe-2.onrender.com/api/inventory")
      .then((res) => res.json())
      .then(setInventory);
  }, []);

  // group products by category
  const categories = products.reduce((acc, p) => {
    acc[p.Category] = acc[p.Category] || [];
    acc[p.Category].push(p);
    return acc;
  }, {});

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Category → image map
  const categoryImages = {
    "Hot Coffee": "/Image/hotcoffee.jpg",
    "Ice Coffee": "/Image/iced_coffee.jpg",
    "Bakery": "/Image/Bakery.jpg",
    "Smoothie": "/Image/smoothie.jpg",
    "Snack": "/Image/snack.jpg",
  };

  // Inline style for blinking low stock row
  const lowStockBlinkStyle = {
    animation: "blink 1s infinite",
    backgroundColor: "rgba(255,0,0,0.5)",
    transition: "background-color 0.3s ease",
  };

  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Welcome to Wings Cafe</h1>

      {/* top row main cards */}
      <div
        className="dashboard-container"
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: "16px",
          justifyContent: "space-between",
        }}
      >
        <div
          className="dashboard-card"
          onClick={() => navigate("/products")}
          style={{ flex: "0 0 22%" }}
        >
          <h2>Products Management</h2>
          <p className="number">{products.length}</p>
        </div>

        <div
          className="dashboard-card"
          onClick={() => navigate("/inventory")}
          style={{ flex: "0 0 22%" }}
        >
          <h2>Inventory Management</h2>
          <p className="number">{inventory.length}</p>
        </div>

        <div
          className="dashboard-card"
          onClick={() => navigate("/sales")}
          style={{ flex: "0 0 22%" }}
        >
          <h2>Sales</h2>
          <p className="number">{sales.length}</p>
        </div>

        <div
          className="dashboard-card"
          onClick={() => navigate("/reports")}
          style={{ flex: "0 0 22%" }}
        >
          <h2>Financial Reports</h2>
          <p className="number">View →</p>
        </div>
      </div>

      {/* categories card with background image */}
      <div
        className="dashboard-card"
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundImage: "url('/Image/category.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <h2>Menu</h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginTop: "12px",
          }}
        >
          {Object.keys(categories).map((cat) => {
            const isExpanded = expandedCategories.includes(cat);

            // Check if any product in this category has low stock
            const hasLowStock = categories[cat].some((p) => p.Quantity <= 5);

            return (
              <div
                key={cat}
                ref={(el) => (categoryRefs.current[cat] = el)} // ✅ assign ref
                className="dashboard-card"
                style={{
                  flex: "0 0 30%",
                  cursor: "pointer",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: hasLowStock
                    ? "rgba(255, 0, 0, 0.2)"
                    : "var(--card-bg)",
                  color: "var(--text-color)",
                  transition: "background-color 0.3s ease",
                }}
                onClick={() => toggleCategory(cat)}
              >
                <h3>{cat}</h3>

                {/* Image */}
                <img
                  src={categoryImages[cat] || "/images/default.jpg"}
                  alt={cat}
                  style={{
                    width: "100%",
                    flex: isExpanded ? "0 0 auto" : "1",
                    height: isExpanded ? "120px" : "100%",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginTop: "8px",
                    transition: "all 0.3s ease",
                  }}
                />

                {isExpanded && (
                  <table
                    className="products-table"
                    style={{ marginTop: "10px" }}
                  >
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Qty</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories[cat].map((p) => (
                        <tr
                          key={p.Product_Code}
                          style={
                            p.Quantity <= 5
                              ? lowStockBlinkStyle
                              : { backgroundColor: "transparent" }
                          }
                        >
                          <td
                            style={
                              p.Quantity === 0
                                ? {
                                    color: "white",
                                    opacity: 0.6,
                                    pointerEvents: "none",
                                  }
                                : {}
                            }
                          >
                            {p.Product_Name}
                            {p.Quantity === 0 && " (Out of Stock)"}
                          </td>
                          <td>{p.Quantity}</td>
                          <td>{p.Price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blink animation keyframes and dark/light mode */}
      <style>
        {`
          @keyframes blink {
            0% { background-color: rgba(255,0,0,0.5); }
            50% { background-color: rgba(255,0,0,1.0); }
            100% { background-color: rgba(255,0,0,0.5); }
          }

          /* Dark mode support */
          :root {
            --card-bg: white;
            --text-color: black;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --card-bg: #1e1e1e;
              --text-color: #f5f5f5;
            }
            .dashboard-card {
              border: 1px solid #333;
            }
            table, th, td {
              color: #0e0d0dff;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Dashboard;
