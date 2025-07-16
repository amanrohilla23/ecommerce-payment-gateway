const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/payment", require("./routes/paymentRoutes"));

const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET
});

let transactions = [];

app.post('/api/payment/create-order', async (req, res) => {
  const { amount } = req.body;
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: 'receipt_' + Date.now()
  });
  res.send({ orderId: order.id });
});

app.post('/api/payment/success', async (req, res) => {
  const { productName, userEmail } = req.body;
  transactions.push({ productName, userEmail });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.ADMIN_EMAIL,
    to: process.env.SUPER_ADMIN,
    subject: "Payment Received",
    text: `${userEmail} paid for ${productName}`
  });

  res.send("Email sent and transaction saved.");
});

app.get("/api/payment/transactions", (req, res) => {
  res.json(transactions);
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
