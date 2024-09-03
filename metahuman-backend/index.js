const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Konfigurasi CORS
const corsOptions = {
  origin: [
    'http://localhost',
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:4080'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    const data = { status: 'Api Healthy And On!' };
    res.json(data);
});

app.get('/metahuman/healthcheck', async (req, res) => {
    try {
        const requestData = {
            query: 'string',
        };
  
        const response = await axios.get('http://localhost:5001/healthcheck', requestData, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
  
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/metahuman/response_audio_v2', async (req, res) => {
    try {
        const { query } = req.body;
  
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }
  
        const requestData = {
            query,
        };
        
        const response = await axios.post('http://localhost:5001/testing_v2/query', requestData, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Jalankan server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});