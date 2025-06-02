const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch'); // ✅ Add this line
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        console.log("User message:", message); // Debug log

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            console.error("ERROR: API key missing!");
            return res.status(500).json({ error: "API key not configured" });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant...'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API Error:", errorText);// Debug log
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json({ response: data.choices[0].message.content });

    } catch (error) {
        console.error("Full Error:", error); // Debug log
        res.status(500).json({ 
            error: 'Failed to get AI response',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const hasApiKey = !!process.env.GROQ_API_KEY;
    res.json({ 
        status: 'ok',
        hasApiKey,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Make sure to create a 'public' folder with index.html`);
    console.log(`🔑 GROQ_API_KEY ${process.env.GROQ_API_KEY ? '✅ Found' : '❌ Missing'}`);
});