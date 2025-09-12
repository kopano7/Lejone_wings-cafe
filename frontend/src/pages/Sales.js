import React, { useEffect, useState } from "react";

function Sales() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchProducts = async () => {
    const res = await fetch("http://localhost:5000/api/products");
    const data = await res.json();
    setProducts(data);

    // ✅ Automatically select first category if available
    if (data.length > 0) {
      const firstCategory = data[0].Category;
      setSelectedCategory(firstCategory);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // group by category
  const categories = products.reduce((acc, p) => {
    acc[p.Category] = acc[p.Category] || [];
    acc[p.Category].push(p);
    return acc;
  }, {});

  const categoryNames = Object.keys(categories);

  // --- CART FUNCTIONS ---
  const addToCart = (product) => {
    if (product.Quantity === 0) return; // prevent adding out-of-stock
    const exists = cart.find((c) => c.Product_Code === product.Product_Code);
    if (exists) {
      setCart(
        cart.map((c) =>
          c.Product_Code === product.Product_Code
            ? { ...c, Quantity: c.Quantity + 1 }
            : c
        )
      );
    } else {
      setCart([...cart, { ...product, Quantity: 1 }]);
    }
    showToast(`${product.Product_Name} added to cart 🛒`);
  };

  const updateQty = (code, qty) => {
    if (qty <= 0) return;
    setCart(
      cart.map((c) =>
        c.Product_Code === code ? { ...c, Quantity: qty } : c
      )
    );
  };

  const removeFromCart = (code) => {
    const item = cart.find((c) => c.Product_Code === code);
    setCart(cart.filter((c) => c.Product_Code !== code));
    if (item) showToast(`${item.Product_Name} removed ❌`);
  };

  const checkout = async () => {
    if (cart.length === 0) return showToast("⚠️ Cart is empty!");

    const body = {
      Items: cart.map((c) => ({
        Product_Code: c.Product_Code,
        Quantity: c.Quantity,
        Price: c.Price,
      })),
    };

    try {
      const res = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        return showToast(err.error || "❌ Sale failed");
      }
      setCart([]);
      fetchProducts(); // refresh stock after sale
      showToast("✅ Sale completed successfully!");
    } catch (err) {
      console.error("Checkout error:", err);
      showToast("❌ Sale failed (server error)");
    }
  };

  const subtotal = cart.reduce((s, c) => s + c.Price * c.Quantity, 0);

  // --- TOAST HANDLER ---
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="card">
      <h2>Stock by Category (Pivoted)</h2>
      <table className="pivot-table">
        <thead>
          <tr>
            <th></th>
            {categoryNames.map((cat) => (
              <th
                key={cat}
                className={`category-header ${
                  selectedCategory === cat ? "selected" : ""
                }`}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
              >
                {cat}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td># Products</td>
            {categoryNames.map((cat) => (
              <td
                key={cat}
                className={selectedCategory === cat ? "selected" : ""}
              >
                {categories[cat].length}
              </td>
            ))}
          </tr>
          <tr>
            <td>Total Stock</td>
            {categoryNames.map((cat) => {
              const total = categories[cat].reduce((s, p) => s + p.Quantity, 0);
              return (
                <td
                  key={cat}
                  className={selectedCategory === cat ? "selected" : ""}
                >
                  {total}
                </td>
              );
            })}
          </tr>
          <tr>
            <td>Low Stock</td>
            {categoryNames.map((cat) => {
              const lowStockCount = categories[cat].filter(
                (p) => p.Quantity <= p.Minimum_Stock
              ).length;
              return (
                <td
                  key={cat}
                  className={selectedCategory === cat ? "selected" : ""}
                >
                  {lowStockCount}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {/* FLEX CONTAINER FOR LEFT/RIGHT CARDS */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        {/* Drill-down products with Add to Cart */}
        {selectedCategory && (
          <div className="sub-card" style={{ flex: 2 }}>
            <h3>{selectedCategory} Products</h3>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories[selectedCategory].map((p) => (
                  <tr
                    key={p.Product_Code}
                    style={
                      p.Quantity === 0
                        ? { color: "red", opacity: 0.7, pointerEvents: "none" }
                        : {}
                    }
                  >
                    <td>{p.Product_Code}</td>
                    <td>
                      {p.Product_Name}
                      {p.Quantity === 0 && " (Out of Stock)"}
                    </td>
                    <td>{p.Price}</td>
                    <td>{p.Quantity}</td>
                    <td>
                      <button
                        className="btn add-to-cart"
                        onClick={() => addToCart(p)}
                        disabled={p.Quantity === 0}
                      >
                        🛒 Add to Cart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CART CARD */}
        <div className="sub-card" style={{ flex: 1 }}>
          <h3>Cart</h3>
          {cart.length === 0 ? (
            <p className="text-muted">Cart is empty.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c) => (
                    <tr key={c.Product_Code}>
                      <td>{c.Product_Name}</td>
                      <td>{c.Price}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={c.Quantity}
                          onChange={(e) =>
                            updateQty(c.Product_Code, Number(e.target.value))
                          }
                          className="qty-input"
                        />
                      </td>
                      <td>{(c.Price * c.Quantity).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn danger"
                          onClick={() => removeFromCart(c.Product_Code)}
                        >
                          ✖ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="cart-summary">
                <span>
                  Subtotal: <strong>{subtotal.toFixed(2)}</strong>
                </span>
                <button className="btn checkout" onClick={checkout}>
                  ✅ Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TOAST POPUP */}
      {toast && <div className="toast">{toast}</div>}

      {/* DARK/LIGHT MODE SUPPORT */}
      <style>
        {`
          :root {
            --bg-color: #ffffff;
            --card-bg: #f9fafb;
            --table-bg: #ffffff;
            --table-text: #000000;
            --text-color: #000000;
            --selected-bg: #d1e7fd;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --bg-color: #0f172a;
              --card-bg: #1e293b;
              --table-bg: #1e293b;
              --table-text: #f8fafc;
              --text-color: #f8fafc;
              --selected-bg: #2a3a4f;
            }
          }

          body {
            background-color: var(--bg-color);
            color: var(--text-color);
          }

          .card, .sub-card {
            background-color: var(--card-bg);
            color: var(--text-color);
            padding: 1rem;
            border-radius: 8px;
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            background-color: var(--table-bg);
            color: var(--table-text);
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          th, td {
            background-color: var(--table-bg);
            color: var(--table-text);
            padding: 8px;
            border: 1px solid #ccc;
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          .selected {
            background-color: var(--selected-bg) !important;
            transition: background-color 0.3s ease;
          }
        `}
      </style>
    </div>
  );
}

export default Sales;
