require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('node:dns');

// Force IPv4 to avoid common IPv6 resolution issues on Windows
dns.setDefaultResultOrder('ipv4first'); 
// Use Google's Public DNS
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const app = express();

// Import Agent and Routes
const { runAutonomousAgent } = require('./jobs/agentJob');
const alertRoutes = require('./routes/alertRoutes'); 

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/distributions', require('./routes/distributions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard').router);
app.use('/api/master', require('./routes/masterRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));

// AI Alerts Route
app.use('/api/alerts', alertRoutes);
app.use('/api/agents', require('./routes/agentRoutes'));

// Static assets
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/api/uploads', require('./routes/uploadRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'College Inventory API Running' }));

// Seed default admin user
async function seedAdmin() {
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const existing = await User.findOne({ role: 'admin' });
  if (!existing) {
    const hashed = await bcrypt.hash('Admin@123', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@college.edu',
      password: hashed,
      role: 'admin'
    });
    console.log('👤 Default admin created: admin@college.edu / Admin@123');
  }
}

// Connect DB & Start Server
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    // Seed default admin
    await seedAdmin();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      // 🤖 TRIGGER THE AI AGENT TO RUN IMMEDIATELY ON STARTUP
      console.log("Triggering Agentic AI initialization...");
      runAutonomousAgent(); 
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });