# CHROME EXTENSION API DOCUMENTATION

## INTRODUCTION

 This Chrome extension API provides endpoints for uploading and retrieving of uploaded videos on the database. 
 It is designed to be user-friendly and can be integrated into various applications that require basic person management functionality.

## API FEATURES
The API offers the following features:
  Uploading a video:
  
          Upload a video sent by the frontend.

Retrieve Video:

          Retrieve the video stored in the database using their unique ID.

Get all videos:
          Getting all the videos stored to the database

## PREREQUISITES
Before you start using the API, ensure you have the following:

  Node.js and npm installed on your system.
  Basic knowledge of RESTful API concepts.

## GETTING STARTED
To begin using the API, follow these steps:

1. Clone the GitHub repository: git clone https://github.com/Kmart002/stage5
2. cd into stage5 folder if you used a command line to clone.
3. Install project dependencies using npm install.
4. Navigate to the app.js file.
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

5. Start the server using: npm app.js

## API ENDPOINTS
### Get Uploaded Video

HTTP Method: POST
Endpoint:  https://stage5-4qe0.onrender.com/upload
Description: Upload a video.
Request Body:
     value: Video.mp4
Response:
    Status Code: 200
    Body: 
              {
                    "message": "Video uploaded successfully",
                    "videoId": "1696243389359-rqpzkf",
                     "videoUrl": "/videos/1696243389359-rqpzkf.mp4",
                     "transcriptionText":" uploaded video transcription text"
              }
 ### Retrieve Video by Id
 
 HTTP Method: GET
  Endpoint: https://stage5-4qe0.onrender.com/video/Id
  Description: Retrieve the video uploaded to the database.
Response:
Status Code: 200
Body: 
  {
    Video played 
  }

### Get all videos
HTTP Method: GET
   Endpoint: https://stage5-4qe0.onrender.com/videos
   Description: All videos displayed
   
## KNOWN LIMITATIONS AND ASSUMPTIONS
  This API uses mongoDB atlas for demonstration purposes.
  Input validation is handled by simple IF statements. It is important to use more robust validation and error handling in a production application.
  No userAuth of any kind. Ensure secure access to your API in a real-world scenario.
  This documentation assumes that the developer is well acquainted with NodeJs and Express

## CONCLUSION
The API simplifies the process of managing person records within your application.
Whether you're building a personal information management system, a contact list, or any other application that requires person-related data, 
the API can help you get started quickly.
