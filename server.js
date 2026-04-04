require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http')
const connectDB = require('./src/config/db');
const startSocket = require('./src/sockets/chatSocket');
const authRoutes = require('./src/routes/authRoute')
const serviceRoutes = require('./src/routes/serviceRoute');
const projectRoutes = require('./src/routes/projectRoute');
const cookieParser = require('cookie-parser');

const app = express();

connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);  
app.use('/api/projects', projectRoutes);

// Create Server
const server = http.createServer(app);

startSocket(server);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});