import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        {/* Main content grows to fill available space */}
        <main className="flex-grow p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>

        {/* Footer will stay at bottom when content is short, flows naturally if content is long */}
        <footer
          style={{
            background: "var(--navbar-bg)",
            color: "var(--navbar-text)",
            borderTop: "1px solid var(--border)",
            padding: "12px 20px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px" }}>
            © {new Date().getFullYear()} Wings Café POS System · All Rights Reserved
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

