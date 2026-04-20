const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '100mb' }));

const purePath = 'C:\\Pure Web';
const dbFile = path.join(purePath, 'pure_db.json');

if (!fs.existsSync(purePath)) fs.mkdirSync(purePath, { recursive: true });

app.post('/api/save', (req, res) => {
    try {
        fs.writeFileSync(dbFile, JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'Saved to C:\\Pure Web' });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/load', (req, res) => {
    if (fs.existsSync(dbFile)) {
        res.json(JSON.parse(fs.readFileSync(dbFile, 'utf8')));
    } else {
        res.json({ pure_archive: [], settings: {} });
    }
});

app.listen(3000, () => console.log('Pure Server running on http://localhost:3000'));
