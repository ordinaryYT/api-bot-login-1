require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost',
      'http://127.0.0.1',
      'http://localhost:8000',
      'http://127.0.0.1:8000'
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// State management
let botManager = null;
const botStates = Array(10).fill(false);

// Helper middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      start: 'POST /api/bots/start',
      stop: 'POST /api/bots/stop',
      status: 'GET /api/bots/status'
    }
  });
});

// Start bots endpoint
app.post('/api/bots/start', async (req, res) => {
  try {
    if (botManager) {
      return res.status(400).json({
        success: false,
        message: 'Bots are already running',
        timestamp: new Date().toISOString()
      });
    }

    botManager = new FNLB();
    await botManager.start({
      apiToken: process.env.FNLB_API_TOKEN || 'DGfCBefvjOU-UORpSFBh8gbArVEGkKK5xb-BB7kZk8NfEFj6hiCf8v2Nefu6',
      botsPerShard: 20
    });

    botStates.fill(true);

    res.status(200).json({
      success: true,
      message: 'Successfully started all bots',
      timestamp: new Date().toISOString(),
      botStates: botStates
    });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start bots',
      timestamp: new Date().toISOString()
    });
  }
});

// Stop bots endpoint
app.post('/api/bots/stop', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(400).json({
        success: false,
        message: 'No bots are currently running',
        timestamp: new Date().toISOString()
      });
    }

    await botManager.stop();
    botManager = null;
    botStates.fill(false);

    res.status(200).json({
      success: true,
      message: 'Successfully stopped all bots',
      timestamp: new Date().toISOString(),
      botStates: botStates
    });
  } catch (error) {
    console.error('Stop error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop bots',
      timestamp: new Date().toISOString()
    });
  }
});

// Status endpoint
app.get('/api/bots/status', (req, res) => {
  res.status(200).json({
    running: !!botManager,
    timestamp: new Date().toISOString(),
    botStates: botStates
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET    /api/health`);
  console.log(`- POST   /api/bots/start`);
  console.log(`- POST   /api/bots/stop`);
  console.log(`- GET    /api/bots/status`);
});