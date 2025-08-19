// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // استخدم متغير البيئة

const INVENTORY_FILE = path.join(__dirname, 'inventory.json');

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // تقديم الملفات الثابتة

// إعداد مسار لجلب بيانات المخزون
app.get('/api/inventory', (req, res) => {
    fs.readFile(INVENTORY_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read inventory file.' });
        }
        res.json(JSON.parse(data));
    });
});

// إعداد مسار لتحديث المخزون (خصم أو إضافة)
app.post('/api/update', (req, res) => {
    const { product_code, quantity, type } = req.body;
    if (!product_code || !quantity || !type) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    fs.readFile(INVENTORY_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read inventory file.' });
        }
        let inventory = JSON.parse(data);
        const product = inventory.find(item => item.product_code.toLowerCase() === product_code.toLowerCase());

        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        
        const oldQuantity = product.quantity;
        let newQuantity;
        if (type === 'add') {
            newQuantity = oldQuantity + quantity;
        } else if (type === 'subtract') {
            if (oldQuantity < quantity) {
                return res.status(400).json({ error: `Insufficient quantity. Available: ${oldQuantity}` });
            }
            newQuantity = oldQuantity - quantity;
        } else {
            return res.status(400).json({ error: 'Invalid operation type.' });
        }
        
        product.quantity = newQuantity;

        fs.writeFile(INVENTORY_FILE, JSON.stringify(inventory, null, 4), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write to inventory file.' });
            }
            res.json({ message: 'Inventory updated successfully.', newQuantity: product.quantity, oldQuantity: oldQuantity });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
