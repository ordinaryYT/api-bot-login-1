require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');

const app = express();

// Enable CORS
app.use(cors({
    origin: ['http://localhost', 'http://127.0.0.1'],
    credentials: true
}));
app.use(express.json());

// Bot status tracking
let botController = null;
const botStatus = {
    running: false,
    bots: Array(10).fill({
        status: 'inactive',
        lastActivity: null
    })
};

// API Endpoints
app.post('/api/bots/start', async (req, res) => {
    try {
        if (botStatus.running) {
            return res.status(400).json({
                success: false,
                message: 'Bots are already running'
            });
        }

        botController = new FNLB({ clusterName: 'FortniteBotCluster' });
        await botController.start({
            apiToken: process.env.FNLB_API_TOKEN || 'your_api_token_here',
            botsPerShard: 10,
            numberOfShards: 1
        });

        botStatus.running = true;
        botStatus.bots = botStatus.bots.map(() => ({
            status: 'active',
            lastActivity: new Date().toISOString()
        }));

        res.json({
            success: true,
            message: 'Bots started successfully',
            status: botStatus
        });
    } catch (error) {
        console.error('Error starting bots:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/bots/stop', async (req, res) => {
    try {
        if (!botStatus.running || !botController) {
            return res.status(400).json({
                success: false,
                message: 'No bots are currently running'
            });
        }

        await botController.stop();
        botController = null;
        botStatus.running = false;
        botStatus.bots = botStatus.bots.map(bot => ({
            ...bot,
            status: 'inactive'
        }));

        res.json({
            success: true,
            message: 'Bots stopped successfully',
            status: botStatus
        });
    } catch (error) {
        console.error('Error stopping bots:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/bots/status', (req, res) => {
    res.json({
        success: true,
        status: botStatus
    });
});

// Serve static files
app.use(express.static('public'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Bot control available at http://localhost:${PORT}`);
});