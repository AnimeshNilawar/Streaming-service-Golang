# Video Streaming Platform

A scalable video streaming platform built with Go, supporting adaptive streaming (DASH & HLS), efficient video processing, and a modern web frontend.

## 🏗️ Architecture Overview

This project implements a distributed video streaming solution with the following components:

- **Go Backend**: Handles video uploads, processing, and serves video segments.
- **Video Processing**: Converts uploaded videos into adaptive streaming formats (DASH & HLS).
- **Static File Server**: Serves video segments and manifests.
- **Web Frontend**: Modern UI for video playback and management (React JS).

## 🚀 Technologies Used

- **Go**: Backend server and video processing logic
- **FFmpeg**: Video transcoding and segmenting (external dependency)
- **React JS**: Frontend (with Vite for development/build)
- **DASH & HLS**: Adaptive streaming protocols

## 🎯 Key Features

- **Video Upload**: Upload MP4 files for processing
- **Adaptive Streaming**: Automatic conversion to DASH and HLS formats
- **Segmented Delivery**: Efficient streaming via chunked segments
- **Modern Frontend**: Responsive video player interface

## 📋 Prerequisites

- **Go 1.20+**
- **Node.js 18+** (for frontend)
- **FFmpeg** installed and available in PATH

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/AnimeshNilawar/Streaming-service-Golang
cd Streaming-service-Golang
```

### 2. Install Frontend Dependencies

```bash
cd video
npm install
```

### 3. Build the Frontend

```bash
npm run build
```

### 4. Run the Go Backend

```bash
cd ..
go run main.go
```

### 5. Access the App

- Open your browser at [http://localhost:8080](http://localhost:8080) (or the port specified in your config).

## 🗂️ Project Structure

```
Streaming-service-Golang/
├── main.go                  # Go backend entry point
├── processVideo.go          # Video processing logic
├── static/                  # Served video segments & manifests
│   ├── <video-id>_dash/     # DASH segments & manifest
│   └── <video-id>_hls/      # HLS segments & playlist
├── uploads/                 # Uploaded source videos
├── video/                   # Frontend (Vite project)
│   ├── src/
│   ├── public/
│   └── ...
└── README.md
```

## 🔗 Endpoints

- **Upload Video**: `/upload` (POST)
- **Stream Video**: `/static/{video-id}_dash/manifest.mpd` or `/static/{video-id}_hls/playlist.m3u8`
- **Frontend**: `/video/index.html` or root

## 🧪 Testing

- Backend: Run and test endpoints with curl/Postman
- Frontend: `npm run dev` for local development

## 🚧 Future Enhancements

- User authentication & video access control
- Video metadata and search
- Real-time transcoding progress
- Dockerization & Kubernetes deployment
- Monitoring and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👨‍💻 Author

<div align="center">
  <img src="https://avatars.githubusercontent.com/AnimeshNilawar?s=120" alt="Animesh Nilawar" style="border-radius: 50%; border: 3px solid #0366d6;">
  
  **Animesh Nilawar**
  
  *Backend Developer & Microservices Enthusiast*
  
  [![GitHub](https://img.shields.io/badge/GitHub-AnimeshNilawar-black?style=for-the-badge&logo=github)](https://github.com/AnimeshNilawar)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://in.linkedin.com/in/animesh-nilawar)
  [![Email](https://img.shields.io/badge/Email-Contact-red?style=for-the-badge&logo=gmail)](mailto:nilawaranimesh@gmail.com)
  
  ---
  
  💡 *Passionate about building scalable distributed systems and exploring modern software architecture patterns*
</div>

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

_This project is a practical exercise in building scalable video streaming solutions with Go and modern web technologies._
