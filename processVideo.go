package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func ProcessVideo(inputPath string, videoID string, localStorage string) error {
	// Resolve absolute input path
	absInputPath, err := filepath.Abs(inputPath)
	if err != nil {
		return fmt.Errorf("error getting absolute path: %v", err)
	}
	inputPath = filepath.ToSlash(absInputPath)

	// Prepare output directories
	hlsOutput := filepath.ToSlash(filepath.Join(localStorage, videoID+"_hls"))
	dashOutput := filepath.ToSlash(filepath.Join(localStorage, videoID+"_dash"))

	if _, err := os.Stat(inputPath); os.IsNotExist(err) {
		return fmt.Errorf("error: input file does not exist: %s", inputPath)
	}

	fmt.Println("HLS Output Path:", hlsOutput)
	fmt.Println("DASH Output Path:", dashOutput)

	// Create Output Directories
	os.MkdirAll(hlsOutput, os.ModePerm)
	os.MkdirAll(dashOutput, os.ModePerm)

	// HLS FFmpeg command
	hlsCmd := exec.Command("ffmpeg",
		"-i", inputPath,
		"-preset", "fast", "-g", "48", "-sc_threshold", "0",
		"-map", "0:v:0", "-map", "0:a:0",
		"-c:v", "libx264", "-crf", "23", "-profile:v", "main", "-c:a", "aac", "-ar", "48000", "-b:a", "128k",
		"-b:v:0", "800k", "-s:v:0", "640x360",
		"-hls_time", "10", "-hls_playlist_type", "vod",
		"-hls_flags", "independent_segments",
		"-hls_segment_filename", filepath.Join(hlsOutput, "segment_%03d.ts"),
		filepath.Join(hlsOutput, "playlist.m3u8"),
	)

	// DASH FFmpeg command
	dashCmd := exec.Command("ffmpeg",
		"-i", inputPath,
		"-preset", "fast", "-g", "48", "-sc_threshold", "0",
		"-r", "30", "-vsync", "cfr",
		"-map", "0:v:0", "-map", "0:v:0", "-map", "0:v:0", "-map", "0:a:0",
		"-c:v", "libx264", "-crf", "23", "-profile:v", "main", "-c:a", "aac", "-ar", "48000", "-b:a", "128k",
		"-b:v:0", "800k", "-s:v:0", "640x360",
		"-b:v:1", "1400k", "-s:v:1", "1280x720",
		"-b:v:2", "2800k", "-s:v:2", "1920x1080",
		"-f", "dash",
		"-adaptation_sets", "id=0,streams=v id=1,streams=a",
		"-seg_duration", "10",
		"-use_timeline", "1",
		"-use_template", "1",
		"-init_seg_name", "init-stream$RepresentationID$.m4s",
		"-media_seg_name", "chunk-stream$RepresentationID$-$Number$.m4s",
		filepath.ToSlash(filepath.Join(dashOutput, "manifest.mpd")),
	)

	// Debug outputs
	hlsCmd.Stdout = os.Stdout
	hlsCmd.Stderr = os.Stderr
	dashCmd.Stdout = os.Stdout
	dashCmd.Stderr = os.Stderr

	// Run HLS command
	fmt.Println("Executing HLS Command:", hlsCmd.String())
	if err := hlsCmd.Run(); err != nil {
		return fmt.Errorf("HLS encoding failed: %v", err)
	}

	// Run DASH command
	fmt.Println("Executing DASH Command:", dashCmd.String())
	if err := dashCmd.Run(); err != nil {
		return fmt.Errorf("DASH encoding failed: %v", err)
	}

	fmt.Println("Encoding completed for HLS & DASH")
	return nil
}
