import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "backend/uploads/" });

let products = []; // temporary array; replace with DB in production

// GET all products
router.get("/", (req, res) => {
  res.json(products);
});

// POST add product
router.post("/", upload.single("image"), (req, res) => {
  const { Product_Code, Product_Name, Category, Price, Quantity, Minimum_Stock } = req.body;
  const Image = req.file ? `/uploads/${req.file.filename}` : null;

  const newProduct = { Product_Code, Product_Name, Category, Price, Quantity, Minimum_Stock, Image };
  products.push(newProduct);
  res.json({ success: true, product: newProduct });
});

// PUT update product
router.put("/:code", upload.single("image"), (req, res) => {
  const code = req.params.code;
  const productIndex = products.findIndex(p => p.Product_Code === code);
  if (productIndex === -1) return res.status(404).json({ error: "Product not found" });

  const updates = req.body;
  if (req.file) updates.Image = `/uploads/${req.file.filename}`;

  products[productIndex] = { ...products[productIndex], ...updates };
  res.json({ success: true, product: products[productIndex] });
});

// DELETE product
router.delete("/:code", (req, res) => {
  const code = req.params.code;
  products = products.filter(p => p.Product_Code !== code);
  res.json({ success: true });
});

export default router;
