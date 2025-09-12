import express from "express";
import cors from "cors";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Paths
const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "Products.json");
const INVENTORY_FILE = path.join(DATA_DIR, "Inventory.json");
const SALES_FILE = path.join(DATA_DIR, "Sale.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Serve uploaded images statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Multer setup for file uploads
await mkdir(UPLOADS_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// -------------------- Helpers --------------------
async function ensureDataFiles() {
  await mkdir(DATA_DIR, { recursive: true });

  async function ensureFile(filePath) {
    try {
      await readFile(filePath, "utf8");
    } catch (err) {
      if (err.code === "ENOENT") {
        await writeFile(filePath, "[]", "utf8");
      } else throw err;
    }
  }

  await ensureFile(PRODUCTS_FILE);
  await ensureFile(INVENTORY_FILE);
  await ensureFile(SALES_FILE);
}

async function readJSON(file) {
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeJSON(file, data) {
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------- PRODUCTS ----------------------
app.get("/api/products", async (req, res) => {
  const products = await readJSON(PRODUCTS_FILE);
  res.json(products);
});

app.post("/api/products", upload.single("image"), async (req, res) => {
  const products = await readJSON(PRODUCTS_FILE);
  const body = req.body || {};

  const Image = req.file ? `/uploads/${req.file.filename}` : "";

  const newProduct = {
    Product_Code: `p_${Date.now()}`,
    Product_Name: body.Product_Name || "Unnamed Product",
    Category: body.Category || "Uncategorized",
    Price: toNumber(body.Price, 0),
    Quantity: Math.max(0, toNumber(body.Quantity, 0)),
    Minimum_Stock: Math.max(0, toNumber(body.Minimum_Stock, 0)),
    Image
  };

  products.push(newProduct);
  await writeJSON(PRODUCTS_FILE, products);

  // Initial inventory record
  if (newProduct.Quantity > 0) {
    const inventory = await readJSON(INVENTORY_FILE);
    inventory.push({
      Inventory_Code: `t_${Date.now()}`,
      Product_Code: newProduct.Product_Code,
      Type: "IN",
      Quantity: newProduct.Quantity,
      Date: new Date().toISOString(),
      Note: "Initial stock (product created)"
    });
    await writeJSON(INVENTORY_FILE, inventory);
  }

  res.status(201).json(newProduct);
});

app.put("/api/products/:code", upload.single("image"), async (req, res) => {
  const products = await readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.Product_Code === req.params.code);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });

  const body = req.body || {};
  const updated = { ...products[idx] };

  if (body.Product_Name) updated.Product_Name = body.Product_Name;
  if (body.Category) updated.Category = body.Category;
  if (body.Price) updated.Price = toNumber(body.Price, updated.Price);
  if (body.Quantity !== undefined) updated.Quantity = Math.max(0, toNumber(body.Quantity, updated.Quantity));
  if (body.Minimum_Stock) updated.Minimum_Stock = Math.max(0, toNumber(body.Minimum_Stock, updated.Minimum_Stock));

  if (req.file) updated.Image = `/uploads/${req.file.filename}`;

  products[idx] = updated;
  await writeJSON(PRODUCTS_FILE, products);

  res.json(updated);
});

app.delete("/api/products/:code", async (req, res) => {
  let products = await readJSON(PRODUCTS_FILE);
  const exists = products.some(p => p.Product_Code === req.params.code);
  if (!exists) return res.status(404).json({ error: "Product not found" });

  products = products.filter(p => p.Product_Code !== req.params.code);
  await writeJSON(PRODUCTS_FILE, products);

  res.json({ message: "Product deleted" });
});

// ---------------------- INVENTORY ----------------------
app.get("/api/inventory", async (req, res) => {
  const inventory = await readJSON(INVENTORY_FILE);
  res.json(inventory);
});

app.post("/api/inventory", async (req, res) => {
  const inventory = await readJSON(INVENTORY_FILE);
  const body = req.body || {};

  const newEntry = {
    Inventory_Code: `t_${Date.now()}`,
    Product_Code: body.Product_Code,
    Type: body.Type || "IN",
    Quantity: toNumber(body.Quantity, 0),
    Date: new Date().toISOString(),
    Note: body.Note || ""
  };

  inventory.push(newEntry);
  await writeJSON(INVENTORY_FILE, inventory);

  res.status(201).json(newEntry);
});

// ---------------------- SALES ----------------------
app.get("/api/sales", async (req, res) => {
  const sales = await readJSON(SALES_FILE);
  res.json(sales);
});

app.post("/api/sales", async (req, res) => {
  const sales = await readJSON(SALES_FILE);
  const body = req.body || {};

  if (!Array.isArray(body.Items) || body.Items.length === 0) {
    return res.status(400).json({ error: "No items in sale" });
  }

  const products = await readJSON(PRODUCTS_FILE);
  const inventory = await readJSON(INVENTORY_FILE);

  const saleItems = [];
  let totalAmount = 0;

  for (const item of body.Items) {
    const prod = products.find(p => p.Product_Code === item.Product_Code);
    if (!prod) continue;

    const qty = Math.min(item.Quantity, prod.Quantity);
    if (qty <= 0) continue;

    prod.Quantity -= qty;
    totalAmount += qty * prod.Price;

    inventory.push({
      Inventory_Code: `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      Product_Code: prod.Product_Code,
      Type: "OUT",
      Quantity: qty,
      Date: new Date().toISOString(),
      Note: "Sale transaction"
    });

    saleItems.push({
      Product_Code: prod.Product_Code,
      Quantity: qty,
      Price: prod.Price
    });
  }

  if (saleItems.length === 0) {
    return res.status(400).json({ error: "No valid items to sell" });
  }

  const newSale = {
    Sale_Code: `s_${Date.now()}`,
    Items: saleItems,
    Total: totalAmount,
    Date: new Date().toISOString(),
    Customer: body.Customer || "Anonymous"
  };

  sales.push(newSale);

  await writeJSON(PRODUCTS_FILE, products);
  await writeJSON(INVENTORY_FILE, inventory);
  await writeJSON(SALES_FILE, sales);

  res.status(201).json(newSale);
});

// ---------------------- REPORTS ----------------------
app.get("/api/reports", async (req, res) => {
  try {
    const products = await readJSON(PRODUCTS_FILE);
    const inventory = await readJSON(INVENTORY_FILE);
    const sales = await readJSON(SALES_FILE);

    // ✅ Helper to get ISO week number
    function getWeekNumber(dateStr) {
      const d = new Date(dateStr);
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const dayOfYear = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000)) + 1;
      return Math.ceil(dayOfYear / 7);
    }

    // ---- Weekly revenue ----
    const weeklyRevenueMap = {};
    sales.forEach(sale => {
      const week = getWeekNumber(sale.Date);
      const year = new Date(sale.Date).getFullYear();
      const key = `${year}-W${week}`;
      const revenue = sale.Items
        ? sale.Items.reduce((s, i) => s + i.Price * i.Quantity, 0)
        : 0;
      weeklyRevenueMap[key] = (weeklyRevenueMap[key] || 0) + revenue;
    });

    const weeklyRevenue = Object.entries(weeklyRevenueMap).map(
      ([week, revenue]) => ({
        week,
        revenue
      })
    );

    // ---- Weekly top selling ----
    const weeklyTopSellingMap = {};
    sales.forEach(sale => {
      const week = getWeekNumber(sale.Date);
      const year = new Date(sale.Date).getFullYear();
      const key = `${year}-W${week}`;
      if (!weeklyTopSellingMap[key]) weeklyTopSellingMap[key] = {};

      if (sale.Items) {
        sale.Items.forEach(i => {
          weeklyTopSellingMap[key][i.Product_Code] =
            (weeklyTopSellingMap[key][i.Product_Code] || 0) + i.Quantity;
        });
      }
    });

    const weeklyTopSelling = Object.entries(weeklyTopSellingMap).map(
      ([week, counts]) => {
        const items = Object.entries(counts)
          .map(([code, Quantity_Sold]) => {
            const prod = products.find(p => p.Product_Code === code);
            return {
              Product_Code: code,
              Product_Name: prod ? prod.Product_Name : code,
              Quantity_Sold
            };
          })
          .sort((a, b) => b.Quantity_Sold - a.Quantity_Sold)
          .slice(0, 10);

        return { week, items };
      }
    );

    // ---- Old metrics (still included) ----
    const totalRevenue = sales.reduce(
      (sum, sale) =>
        sum +
        (sale.Items
          ? sale.Items.reduce((s, i) => s + i.Price * i.Quantity, 0)
          : 0),
      0
    );

    const soldCounts = {};
    sales.forEach(sale => {
      if (sale.Items) {
        sale.Items.forEach(i => {
          soldCounts[i.Product_Code] =
            (soldCounts[i.Product_Code] || 0) + i.Quantity;
        });
      }
    });

    const topSelling = Object.entries(soldCounts)
      .map(([code, Quantity_Sold]) => {
        const prod = products.find(p => p.Product_Code === code);
        return {
          Product_Code: code,
          Product_Name: prod ? prod.Product_Name : code,
          Quantity_Sold
        };
      })
      .sort((a, b) => b.Quantity_Sold - a.Quantity_Sold)
      .slice(0, 10);

    const recentInventory = inventory.slice(-10).reverse();
    const lowStock = products.filter(p => p.Quantity <= p.Minimum_Stock);

    // ✅ Return weekly + existing data
    res.json({
      totalRevenue,
      topSelling,
      weeklyRevenue,
      weeklyTopSelling,
      recentInventory,
      lowStock
    });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;

ensureDataFiles()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("Failed to ensure data files:", err);
    process.exit(1);
  });
