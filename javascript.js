require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost', 'http://127.0.0.1'],
    credentials: true
}));
app.use(express.json());

// Bot control with enhanced status tracking
let botController = null;
const botStatus = {
    running: false,
    bots: Array(10).fill({
        status: 'inactive',
        lastActivity: null,
        shard: null
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

        // Initialize bot controller with cluster name
        botController = new FNLB({
            clusterName: 'FortniteBotArmy'
        });

        // Start bots with configuration
        await botController.start({
            apiToken: process.env.FNLB_API_TOKEN || 'DGfCBefvjOU-UORpSFBh8gbArVEGkKK5xb-BB7kZk8NfEFj6hiCf8v2Nefu6',
            botsPerShard: 20,
            numberOfShards: 1
        });

        // Update status
        botStatus.running = true;
        botStatus.bots = botStatus.bots.map(() => ({
            status: 'active',
            lastActivity: new Date().toISOString(),
            shard: 0
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
        
        // Update status
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Bot control API available at http://localhost:${PORT}/api/bots`);
});