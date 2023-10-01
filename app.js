
const express = require ('express');
const multer = require('multer');
const path = require ('path');
const cors = require('cors');
const app = express();
const port = 6000;

// In-memory database to store video information
const videos = [];

//multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
      const uniqueID = Date.now() + '-' + Math.random().toString(36).substring(7);
      const fileName = uniqueID + path.extname(file.originalname);
      // Store the video information in the database
      videos.push({ id: uniqueID, filename: fileName });
      cb(null, fileName);
    },
  });
    
    const upload = multer({storage});
   // Route for video upload
app.post('/upload', upload.single('video'), (req, res) => {
  const uploadedVideo = videos.find((video) => video.filename === req.file.filename);

  if (!uploadedVideo) {
    return res.status(500).json({ error: 'Error processing the uploaded video' });
  }

  res.json({ message: 'Video uploaded successfully', videoId: uploadedVideo.id });
});


  // Route to get a video by its ID
app.get('/video/:id', (req, res) => {
  const id = req.params.id;
  const videoInfo = videos.find((video) => video.id === id);

  if (!videoInfo) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const videoPath = path.join(__dirname, 'uploads', videoInfo.filename);

  // Send the video file as a response
  res.sendFile(videoPath);
});
  // Route to get a list of all videos
app.get('/videos', (req, res) => {
  const videoList = videos.map((video) => ({ id: video.id, filename: video.filename }));
  res.json({ videos: videoList });
});
app.use(cors());
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', 'https://github.com');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   next();
// });


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
