const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedAdmin = require('./config/seedAdmin');
const seedData = require('./config/seedData');

dotenv.config();

connectDB().then(() => seedAdmin()).then(() => seedData());

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const merchandiseRoutes = require('./routes/merchandiseRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const sponsorRoutes = require('./routes/sponsorRoutes');
const votingRoutes = require('./routes/votingRoutes');
const ocApplicationRoutes = require('./routes/ocApplicationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/merchandise', merchandiseRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/oc-applications', ocApplicationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
