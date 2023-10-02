require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { Deepgram } = require('@deepgram/sdk');

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

// Configure CORS to allow requests from a specific origin (e.g., frontend URL)
const allowedOrigins = ['https://stage5-4qe0.onrender.com', 'http://localhost:6006'];

app.use(cors({ origin: '*' }));

// Initialize the Deepgram object with your API key
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const uploadedVideo = videos.find((video) => video.filename === req.file.filename);

    if (!uploadedVideo) {
      throw new Error('Error processing the uploaded video');
    }

    const filePath = req.file.path;
    const MIMETYPE_OF_FILE = req.file.mimetype;
    const videoFileName = req.file.filename;
    const videoUrl = `/videos/${videoFileName}`;
    const audioSource = {
      stream: fs.createReadStream(filePath),
      mimetype: MIMETYPE_OF_FILE,
    };

    try {
      const response = await deepgram.transcription.preRecorded(audioSource, {
        punctuate: true,
        // other options are available
      });

      let transcriptionText = '';
      if (response && response.results && response.results.channels && response.results.channels.length > 0) {
        transcriptionText = response.results.channels[0].alternatives[0].transcript;
      }

      // Include both videoUrl and transcriptionText in the response
      res.status(200).json({
        message: 'Video uploaded successfully',
        videoId: uploadedVideo.id,
        videoUrl,
        transcriptionText,
      });
    } catch (error) {
      console.error('Deepgram API Error:', error);
      res.status(400).json({ error: error.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
// Get video by id
app.get('/video/:id', (req, res) => {
  const id = req.params.id;
  const videoInfo = videos.find((video) => video.id === id);

  if (!videoInfo) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const videoPath = path.join(__dirname, 'uploads', videoInfo.filename);
  res.sendFile(videoPath);
});

// GET request to retrieve a list of all uploaded videos
app.get('/videos', (req, res) => {
  const videoList = videos.map((video) => ({
    id: video.id,
    filename: video.filename,
  }));
  res.json({ videos: videoList });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
