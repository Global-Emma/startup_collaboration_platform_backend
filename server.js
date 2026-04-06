require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http')
const connectDB = require('./src/config/db');
const startSocket = require('./src/sockets/chatSocket');
const cookieParser = require('cookie-parser');
const Redis = require('ioredis')
const authRoutes = require('./src/routes/authRoute')
const serviceRoutes = require('./src/routes/serviceRoute');
const projectRoutes = require('./src/routes/projectRoute');
const applicationRoutes = require('./src/routes/applicationRoute');


const app = express();

const redisClient = new Redis(process.env.REDIS_URL)

redisClient.on('connect', ()=>{
  console.log('Connected to Redis');
})

redisClient.on('error', (error)=>{
  console.error('Error connecting to Redis', error);
});

connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', (req, res, next)=>{
  req.redisClient = redisClient;
  next();
}, authRoutes);
app.use('/api/services', (req, res, next)=>{
  req.redisClient = redisClient;
  next();
}, serviceRoutes);
app.use('/api/projects', (req, res, next)=>{
  req.redisClient = redisClient;
  next();
}, projectRoutes);
app.use('/api/apply', (req, res, next)=>{
  req.redisClient = redisClient;
  next();
}, applicationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: err.message,
  });
});
// Create Server
const server = http.createServer(app);

startSocket(server);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});