const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

function loadPrices() {
  const filePath = path.join(__dirname, 'prices.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
}

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pricing API is running'
  });
});

app.post('/api/pricing', (req, res) => {
  try {
    const apiKey = req.header('x-api-key');

    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Server API key is not configured'
      });
    }

    if (apiKey !== API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { productCode, quantity } = req.body;

    if (!productCode) {
      return res.status(400).json({
        success: false,
        message: 'productCode is required'
      });
    }

    const prices = loadPrices();

    const product = prices.find(
      p => p.productCode.toUpperCase() === productCode.toUpperCase()
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `No price found for productCode ${productCode}`
      });
    }

    const qty = quantity && quantity > 0 ? quantity : 1;
    const totalPrice = product.unitPrice * qty;

    return res.status(200).json({
      success: true,
      productCode: product.productCode,
      productName: product.productName,
      unitPrice: product.unitPrice,
      quantity: qty,
      totalPrice: totalPrice,
      currency: product.currency
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Pricing API running on port ${PORT}`);
});