import React, { useEffect, useState } from "react";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [quantityMap, setQuantityMap] = useState({});
  const [removeMap, setRemoveMap] = useState({});
  const [toast, setToast] = useState(null);

  // ✅ Base API link from Render
  const API_BASE = "https://lejone-wings-cafe-2.onrender.com/api";

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory`);
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      data.sort((a, b) => (a.Type === "IN" ? -1 : 1));
      setInventory(data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(data);

      const initQty = {};
      data.forEach((p) => {
        initQty[p.Product_Code] = 0;
      });
      setQuantityMap(initQty);
      setRemoveMap(initQty);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchProducts();

    const handleSaleCompleted = () => fetchInventory();
    window.addEventListener("saleCompleted", handleSaleCompleted);

    const interval = setInterval(fetchInventory, 5000);

    return () => {
      window.removeEventListener("saleCompleted", handleSaleCompleted);
      clearInterval(interval);
    };
  }, []);

  const handleQtyChange = (code, value, isRemove = false) => {
    if (isRemove) {
      setRemoveMap({ ...removeMap, [code]: Number(value) });
    } else {
      setQuantityMap({ ...quantityMap, [code]: Number(value) });
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addStock = async (product) => {
    const qty = quantityMap[product.Product_Code];
    if (!qty || qty <= 0) return;

    try {
      await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Product_Code: product.Product_Code,
          Type: "IN",
          Quantity: qty,
          Note: "Manual stock addition",
        }),
      });

      await fetch(`${API_BASE}/products/${product.Product_Code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Quantity: product.Quantity + qty }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.Product_Code === product.Product_Code
            ? { ...p, Quantity: p.Quantity + qty }
            : p
        )
      );

      setQuantityMap({ ...quantityMap, [product.Product_Code]: 0 });
      fetchInventory();
      showToast(`Added ${qty} to ${product.Product_Name}`);
    } catch (err) {
      console.error("Failed to add stock:", err);
      showToast("Failed to add stock", "error");
    }
  };

  const removeStock = async (product) => {
    const qty = removeMap[product.Product_Code];
    if (!qty || qty <= 0) return;
    if (qty > product.Quantity) {
      showToast("Cannot remove more than available quantity", "warning");
      return;
    }

    try {
      await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Product_Code: product.Product_Code,
          Type: "OUT",
          Quantity: qty,
          Note: "Manual stock removal",
        }),
      });

      await fetch(`${API_BASE}/products/${product.Product_Code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Quantity: product.Quantity - qty }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.Product_Code === product.Product_Code
            ? { ...p, Quantity: p.Quantity - qty }
            : p
        )
      );

      setRemoveMap({ ...removeMap, [product.Product_Code]: 0 });
      fetchInventory();
      showToast(`Removed ${qty} from ${product.Product_Name}`);
    } catch (err) {
      console.error("Failed to remove stock:", err);
      showToast("Failed to remove stock", "error");
    }
  };

  return (
    <div>
      <h2>Inventory</h2>

      {/* Product Stock Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Manage Stock</h3>
        <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Current Quantity</th>
              <th>Add Quantity</th>
              <th></th>
              <th>Remove Quantity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.Product_Code}>
                <td>{p.Product_Code}</td>
                <td>{p.Product_Name}</td>
                <td>{p.Quantity}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={quantityMap[p.Product_Code] || 0}
                    onChange={(e) => handleQtyChange(p.Product_Code, e.target.value)}
                    style={{ width: "60px" }}
                  />
                </td>
                <td>
                  <button onClick={() => addStock(p)}>➕ Add</button>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={removeMap[p.Product_Code] || 0}
                    onChange={(e) => handleQtyChange(p.Product_Code, e.target.value, true)}
                    style={{ width: "60px" }}
                  />
                </td>
                <td>
                  <button onClick={() => removeStock(p)}>➖ Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inventory Table */}
      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Inventory Code</th>
            <th>Product Code</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Date</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.Inventory_Code}>
              <td>{item.Inventory_Code}</td>
              <td>{item.Product_Code}</td>
              <td>{item.Type}</td>
              <td>{item.Quantity}</td>
              <td>{new Date(item.Date).toLocaleString()}</td>
              <td>{item.Note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Custom Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor:
              toast.type === "error"
                ? "#f56565"
                : toast.type === "warning"
                ? "#ecc94b"
                : "#48bb78",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 9999,
            transition: "opacity 0.3s",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Inventory;
