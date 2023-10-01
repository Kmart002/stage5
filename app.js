
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 6006; 

const videos = [];

// Middleware for JSON parsing
app.use(express.json());

// Middleware for URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueID = Date.now() + '-' + Math.random().toString(36).substring(7);
    const fileName = uniqueID + path.extname(file.originalname);
    videos.push({ id: uniqueID, filename: fileName });
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// Configure CORS to allow requests from a specific origin (e.g. frontend URL)
const allowedOrigins = ['https://stage5-4qe0.onrender.com', 'http://localhost:6006']; 

app.use(cors({ origin: '*' }));

app.post('/upload', upload.single('video'), (req, res) => {
  try {
    const uploadedVideo = videos.find((video) => video.filename === req.file.filename);

    if (!uploadedVideo) {
      throw new Error('Error processing the uploaded video');
    }

    res.json({ message: 'Video uploaded successfully', videoId: uploadedVideo.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/video/:id', (req, res) => {
  const id = req.params.id;
  const videoInfo = videos.find((video) => video.id === id);

  if (!videoInfo) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const videoPath = path.join(__dirname, 'uploads', videoInfo.filename);

  res.sendFile(videoPath);
});

app.get('/videos', (req, res) => {
  const videoList = videos.map((video) => ({ id: video.id, filename: video.filename }));
  res.json({ videos: videoList });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});