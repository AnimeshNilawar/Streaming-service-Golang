package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// Database model
type VideoMeta struct {
	ID         string
	Name       string
	Path       string
	UploadDate time.Time
	Duration   string
	Thumbnail  string
}

// Init Postgres DB
func InitDB() *sql.DB {
	connStr := "user=admin password=12345 dbname=streaming-service sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to DB:", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal("Cannot reach DB:", err)
	}

	// Auto-create the 'videos' table if it doesn't exist
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS videos (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		path TEXT NOT NULL,
		upload_date TIMESTAMP NOT NULL,
		duration TEXT NOT NULL,
		thumbnail TEXT
	);
	`
	_, err = db.Exec(createTableQuery)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}

	fmt.Println("Database connected and table ensured.")
	return db
}

// Get video duration using FFprobe
func getVideoDuration(path string) (string, error) {
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		path,
	)

	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

// Generate thumbnail from video
// func generateThumbnail(videoPath string, videoID string) (string, error) {
// 	// Create thumbnails directory if it doesn't exist
// 	thumbnailDir := "static/thumbnails"
// 	if err := os.MkdirAll(thumbnailDir, 0755); err != nil {
// 		return "", err
// 	}

// 	// Generate thumbnail at 1 second mark
// 	thumbnailPath := filepath.ToSlash(filepath.Join(thumbnailDir, videoID+".jpg"))
// 	cmd := exec.Command("ffmpeg",
// 		"-i", videoPath,
// 		"-ss", "00:00:01.000",
// 		"-vframes", "1",
// 		"-vf", "scale=480:-1",
// 		thumbnailPath,
// 	)

// 	if err := cmd.Run(); err != nil {
// 		return "", err
// 	}

// 	return thumbnailPath, nil
// }

// Handle Upload
func uploadHandler(c *gin.Context, db *sql.DB) {
	// Get form fields
	videoName := c.PostForm("video_name")
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No video file is received"})
		return
	}

	// Generate unique video ID
	videoID := uuid.New().String()
	uploadPath := filepath.ToSlash(filepath.Join("uploads", videoID+".mp4"))

	// Save file locally
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save video file"})
		return
	}

	// Get duration
	duration, err := getVideoDuration(uploadPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to extract metadata"})
		return
	}

	// Check if thumbnail was uploaded
	var thumbnailPath string
	thumbnailFile, err := c.FormFile("thumbnail")
	if err == nil {
		// Create thumbnails directory if it doesn't exist
		thumbnailDir := "static/thumbnails"
		if err := os.MkdirAll(thumbnailDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create thumbnail directory"})
			return
		}

		// Save thumbnail with same ID as video but with image extension
		thumbnailExt := filepath.Ext(thumbnailFile.Filename)
		if thumbnailExt == "" {
			thumbnailExt = ".jpg" // Default extension if none provided
		}
		thumbnailPath = filepath.ToSlash(filepath.Join(thumbnailDir, videoID+thumbnailExt))

		if err := c.SaveUploadedFile(thumbnailFile, thumbnailPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save thumbnail"})
			return
		}
	}

	// Save metadata in DB
	query := `INSERT INTO videos (id, name, path, upload_date, duration, thumbnail) 
          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err = db.Exec(query, videoID, videoName, uploadPath, time.Now(), duration, thumbnailPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB insert failed"})
		return
	}

	// Process encoding
	if err := ProcessVideo(uploadPath, videoID, "static"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encoding failed"})
		return
	}

	response := gin.H{
		"message":  "Upload & Processing successful",
		"video_id": videoID,
		"hls_url":  "/static/" + videoID + "_hls/playlist.m3u8",
		"dash_url": "/static/" + videoID + "_dash/manifest.mpd",
		"duration": duration,
	}

	// Add thumbnail URL to response if it exists
	if thumbnailPath != "" {
		response["thumbnail"] = "/" + thumbnailPath
	}

	c.JSON(http.StatusOK, response)
}

func main() {
	db := InitDB()
	defer db.Close()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Serve static HLS/DASH folders
	router.Static("/static", "./static")

	// Upload route
	router.POST("/upload", func(c *gin.Context) {
		uploadHandler(c, db)
	})

	// Start server
	router.Run(":8080")
}
