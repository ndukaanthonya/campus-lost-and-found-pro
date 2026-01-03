// server.js - The Brain of the App
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. Middleware (The Gatekeepers) ---
app.use(cors());
app.use(express.json()); // Allows server to read JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serves your HTML/CSS

// Session Config (For Admin Login)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true only if using HTTPS in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// --- 2. Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to UNN Database Successfully"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// --- 3. Data Models (The Blueprints) ---

// Item Blueprint
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  iconClass: { type: String, default: 'fa-box' }, // e.g., 'fa-mobile'
  location: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['active', 'claimed'], default: 'active' },
  description: { type: String },   // Public description for students
  adminDetails: { type: String },  // Secret details for Admin only
  createdAt: { type: Date, default: Date.now }
});

// Reservation Blueprint (Who wants the item?)
const reservationSchema = new mongoose.Schema({
  itemId: String,
  itemName: String,
  fullName: String,
  userType: String, // Student or Staff
  contactInfo: String,
  comment: String,
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  date: { type: Date, default: Date.now }
});

// Admin Blueprint
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});

const Item = mongoose.model('Item', itemSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);
const Admin = mongoose.model('Admin', adminSchema);

// --- 4. Special Setup: Create Default Admin ---
// This runs once when server starts to ensure you have a login.
// Username: admin
// Password: admin123(You can change this later)
const initializeAdmin = async () => {
  const exists = await Admin.findOne({ username: 'admin' });
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await new Admin({ username: 'admin', passwordHash: hash }).save();
    console.log("🔒 Default Admin Created (User: admin | Pass: admin123)");
  }
};
initializeAdmin();

// --- 5. Security Check Helper ---
const requireAuth = (req, res, next) => {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized. Please login." });
  }
};

// --- 6. API Routes (The Instructions) ---

// GET: Fetch all items (Public)
app.get('/api/items', async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json(items);
});

// POST: Add new item (Admin Only)
app.post('/api/items', requireAuth, async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.json({ success: true, item: newItem });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH: Update Status (Mark Claimed/Active) - Admin Only
app.patch('/api/items/:id', requireAuth, async (req, res) => {
  await Item.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ success: true });
});

// DELETE: Remove Item - Admin Only
app.delete('/api/items/:id', requireAuth, async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  // Also delete any reservations for this item to keep DB clean
  await Reservation.deleteMany({ itemId: req.params.id });
  res.json({ success: true });
});

// POST: Make a Reservation (Public)
app.post('/api/reservations', async (req, res) => {
  try {
    const newRes = new Reservation(req.body);
    await newRes.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Could not save reservation" });
  }
});

// GET: View Reservations (Admin Only)
app.get('/api/reservations', requireAuth, async (req, res) => {
  const list = await Reservation.find().sort({ date: -1 });
  res.json(list);
});

// POST: Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  
  if (admin && await bcrypt.compare(password, admin.passwordHash)) {
    req.session.admin = true; // Login successful
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// POST: Admin Logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET: Check if Logged In (For page loads)
app.get('/api/admin/check', (req, res) => {
  res.json({ loggedIn: !!req.session?.admin });
});

// --- 7. Start Server ---
// UPDATE: Using /.*/ because Express 5 no longer accepts '*'
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });