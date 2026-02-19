const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Load dữ liệu từ file JSON
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Lỗi khi đọc file data.json');
  }
  return [];
}

// Lưu dữ liệu vào file JSON
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✓ Dữ liệu đã được lưu');
  } catch (error) {
    console.log('Lỗi khi lưu file data.json');
  }
}

// API Routes
app.get('/api/members', (req, res) => {
  const data = loadData();
  res.json(data);
});

app.post('/api/members', (req, res) => {
  const data = req.body;
  saveData(data);
  res.json({ success: true, message: 'Dữ liệu đã được lưu' });
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌳 Server cây gia phả đang chạy: http://localhost:${PORT}`);
  console.log('Nhấn Ctrl+C để dừng server');
});
