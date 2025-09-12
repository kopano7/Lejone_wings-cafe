import React, { useEffect, useState } from "react";

function Products() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [editValues, setEditValues] = useState({});
  const [newProduct, setNewProduct] = useState({
    Product_Code: "",
    Product_Name: "",
    Category: "",
    Price: "",
    Quantity: 0,
    Minimum_Stock: "",
    Image: null
  });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);

      if (data.length > 0 && !activeCategory) {
        setActiveCategory(data[0].Category);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      showToast("Error loading products", "error");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = [...new Set(products.map((p) => p.Category))];

  const handleSaveProduct = async (code) => {
    try {
      const formData = new FormData();
      if (editValues[code]?.Price !== undefined)
        formData.append("Price", Number(editValues[code].Price));
      if (editValues[code]?.Minimum_Stock !== undefined)
        formData.append("Minimum_Stock", Number(editValues[code].Minimum_Stock));
      if (editValues[code]?.Image instanceof File)
        formData.append("image", editValues[code].Image);

      const res = await fetch(`http://localhost:5000/api/products/${code}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update product");

      const updated = await res.json();
      showToast("Product updated successfully");

      setProducts((prev) =>
        prev.map((p) => (p.Product_Code === code ? updated : p))
      );

      setEditValues((prev) => {
        const copy = { ...prev };
        delete copy[code];
        return copy;
      });
    } catch (err) {
      console.error("Error updating product:", err);
      showToast("Error updating product", "error");
    }
  };

  const handleDeleteProduct = async (code) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${code}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      showToast("Product deleted");

      setProducts((prev) => prev.filter((p) => p.Product_Code !== code));
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast("Error deleting product", "error");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(newProduct).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to add product");

      const saved = await res.json();
      showToast("Product added successfully");

      setProducts((prev) => [...prev, saved]);

      setNewProduct({
        Product_Code: "",
        Product_Name: "",
        Category: "",
        Price: "",
        Quantity: 0,
        Minimum_Stock: "",
        Image: null,
      });

      if (!categories.includes(saved.Category)) setActiveCategory(saved.Category);
    } catch (err) {
      console.error("Error adding product:", err);
      showToast("Error adding product", "error");
    }
  };

  return (
    <div
      className="container"
      style={{
        backgroundImage: "url('/Image/category.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",   // ✅ fill full screen height
        width: "100%",        // ✅ fill full screen width
        padding: "20px",
      }}
    >
      <h1 className="page-title">Products Management</h1>

      {/* Category tabs */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <div
            key={cat}
            className={`category-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* Category products table */}
      {categories.map((cat) => (
        <div
          key={cat}
          className="products-card"
          style={{ display: activeCategory === cat ? "block" : "none" }}
        >
          <h2>{cat} Products</h2>
          <table className="products-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Min Stock</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter((p) => p.Category === cat)
                .map((p) => (
                  <tr key={p.Product_Code}>
                    <td>{p.Product_Code}</td>
                    <td>{p.Product_Name}</td>
                    <td>
                      <input
                        type="number"
                        value={editValues[p.Product_Code]?.Price ?? p.Price}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            [p.Product_Code]: {
                              ...editValues[p.Product_Code],
                              Price: e.target.value,
                            },
                          })
                        }
                      />
                    </td>
                    <td>{p.Quantity}</td>
                    <td>
                      <input
                        type="number"
                        value={
                          editValues[p.Product_Code]?.Minimum_Stock ??
                          p.Minimum_Stock
                        }
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            [p.Product_Code]: {
                              ...editValues[p.Product_Code],
                              Minimum_Stock: e.target.value,
                            },
                          })
                        }
                      />
                    </td>
                    <td>
                      <label style={{ cursor: "pointer" }}>
                        <img
                          src={
                            p.Image
                              ? `http://localhost:5000${p.Image}`
                              : "/images/default.jpg"
                          }
                          alt={p.Product_Name}
                          className="product-image"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              [p.Product_Code]: {
                                ...editValues[p.Product_Code],
                                Image: e.target.files[0],
                              },
                            })
                          }
                        />
                      </label>
                    </td>
                    <td>
                      <button
                        className="success"
                        onClick={() => handleSaveProduct(p.Product_Code)}
                      >
                        Save
                      </button>
                      <button
                        className="danger"
                        onClick={() => handleDeleteProduct(p.Product_Code)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Add product form */}
      <form className="add-product-form" onSubmit={handleAddProduct}>
        <input
          placeholder="Code"
          value={newProduct.Product_Code}
          onChange={(e) =>
            setNewProduct({ ...newProduct, Product_Code: e.target.value })
          }
          required
        />
        <input
          placeholder="Name"
          value={newProduct.Product_Name}
          onChange={(e) =>
            setNewProduct({ ...newProduct, Product_Name: e.target.value })
          }
          required
        />
        <input
          placeholder="Category"
          value={newProduct.Category}
          onChange={(e) =>
            setNewProduct({ ...newProduct, Category: e.target.value })
          }
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={newProduct.Price}
          onChange={(e) =>
            setNewProduct({ ...newProduct, Price: e.target.value })
          }
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={newProduct.Quantity}
          onChange={(e) =>
            setNewProduct({ ...newProduct, Quantity: e.target.value })
          }
          required
        />
        <input
          type="number"
          placeholder="Min Stock"
          value={newProduct.Minimum_Stock}
          onChange={(e) =>
            setNewProduct({ ...newProduct, Minimum_Stock: e.target.value })
          }
          required
        />
        <label style={{ cursor: "pointer" }}>
          Upload Image
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) =>
              setNewProduct({ ...newProduct, Image: e.target.files[0] })
            }
          />
        </label>
        {newProduct.Image && (
          <img
            src={URL.createObjectURL(newProduct.Image)}
            alt="Preview"
            className="product-image-preview"
          />
        )}
        <button type="submit" className="primary">
          Add Product
        </button>
      </form>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Dark/light mode adaptation */}
      <style>{`
        .container {
          color: var(--text-color);
          transition: color 0.3s ease, background-color 0.3s ease;
        }
        .products-table, .products-table th, .products-table td, 
        .products-table input {
          background-color: var(--table-bg);
          color: var(--table-text);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        :root {
          --table-bg: #ffffff;
          --table-text: #000000;
          --text-color: #000000;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --table-bg: #1e293b;
            --table-text: #f8fafc;
            --text-color: #f8fafc;
          }
        }
      `}</style>
    </div>
  );
}

export default Products;
