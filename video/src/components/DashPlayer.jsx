import React, { useEffect, useRef, useState } from 'react';
import * as dashjs from 'dashjs';
import '../styles/DashPlayer.css';

const DashPlayer = ({ initialVideoId, dashUrl, autoPlay = false }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [videoId, setVideoId] = useState('');
    const [currentVideoId, setCurrentVideoId] = useState(initialVideoId || '');
    const [stats, setStats] = useState({
        downloadSpeed: 0,
        bufferLevel: 0,
        bitrate: 0,
        droppedFrames: 0
    });

    // Set videoId from prop if provided
    useEffect(() => {
        if (initialVideoId) {
            setCurrentVideoId(initialVideoId);
        }
    }, [initialVideoId]);

    // Construct the source URL based on video ID or use provided dashUrl
    const getSourceUrl = (id) => {
        return dashUrl || `http://localhost:8080/static/${id}_dash/manifest.mpd`;
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        if (videoId.trim()) {
            setCurrentVideoId(videoId);
        }
    };

    useEffect(() => {
        // Only initialize player if we have a video ID
        if (!currentVideoId && !dashUrl) return;

        const sourceUrl = getSourceUrl(currentVideoId);
        console.log(`Loading video from: ${sourceUrl}`);

        // Clean up previous player instance if it exists
        if (playerRef.current) {
            playerRef.current.reset();
            playerRef.current = null;
        }

        // Initialize player
        const player = dashjs.MediaPlayer().create();
        player.initialize(videoRef.current, sourceUrl, true);
        playerRef.current = player;

        // Stats collection interval
        const interval = setInterval(() => {
            try {
                if (!player) return;

                // Get metrics
                const dashMetrics = player.getDashMetrics();

                // Buffer level
                let bufferLevel = 0;
                try {
                    bufferLevel = dashMetrics.getCurrentBufferLevel('video') || 0;
                } catch (e) {
                    console.log('Error getting buffer level:', e);
                }

                // Get bitrate info using correct method
                let bitrate = 0;
                try {
                    // Check which API is available
                    if (typeof player.getQualityFor === 'function') {
                        const qualityIdx = player.getQualityFor('video');
                        const bitrateList = player.getBitrateInfoListFor ?
                            player.getBitrateInfoListFor('video') :
                            player.getTopBitrateInfoFor ? [player.getTopBitrateInfoFor('video')] : [];

                        if (bitrateList && bitrateList[qualityIdx]) {
                            bitrate = Math.round(bitrateList[qualityIdx].bitrate / 1000);
                        }
                    } else if (typeof player.getAverageThroughput === 'function') {
                        // Alternative: get throughput if bitrate info isn't available
                        bitrate = Math.round(player.getAverageThroughput('video') / 1000);
                    }
                } catch (e) {
                    console.log('Error getting bitrate:', e);
                }

                // Calculate download speed
                let downloadSpeed = 0;
                try {
                    const httpRequests = dashMetrics.getHttpRequests('video') || [];
                    const latestRequest = httpRequests[httpRequests.length - 1];

                    if (latestRequest && latestRequest._tfinish && latestRequest._trequest) {
                        const downloadTime = latestRequest._tfinish - latestRequest._trequest;
                        const bytes = latestRequest.trace ?
                            latestRequest.trace.reduce((a, b) => a + (b.b[0] || 0), 0) :
                            latestRequest.bytes || 0;

                        if (downloadTime > 0 && bytes > 0) {
                            // Convert to kbps (bytes to bits / time in seconds)
                            downloadSpeed = Math.round((bytes * 8) / (downloadTime / 1000) / 1000);
                        }
                    }
                } catch (e) {
                    console.log('Error calculating download speed:', e);
                }

                // Get dropped frames
                let droppedFrames = 0;
                try {
                    const videoElement = videoRef.current;
                    droppedFrames = videoElement && videoElement.getVideoPlaybackQuality ?
                        videoElement.getVideoPlaybackQuality().droppedVideoFrames : 0;
                } catch (e) {
                    console.log('Error getting dropped frames:', e);
                }

                // Update stats
                setStats({
                    downloadSpeed,
                    bufferLevel: typeof bufferLevel === 'number' ? bufferLevel.toFixed(2) : 'N/A',
                    bitrate,
                    droppedFrames
                });
            } catch (error) {
                console.error('Error updating stats:', error);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (playerRef.current) {
                playerRef.current.reset();
                playerRef.current = null;
            }
        };
    }, [currentVideoId, dashUrl]);

    // Only show the form if no initialVideoId was provided
    const showForm = !initialVideoId && !dashUrl;

    return (
        <div className="dash-player-wrapper">
            {showForm && (
                <div className="mb-4">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={videoId}
                            onChange={(e) => setVideoId(e.target.value)}
                            placeholder="Enter video ID"
                            className="flex-1 p-2 border border-gray-300 rounded"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Load Video
                        </button>
                    </form>
                </div>
            )}

            {(currentVideoId || dashUrl) ? (
                <>
                    <div className="player-container">
                        <video
                            ref={videoRef}
                            controls
                            autoPlay={autoPlay}
                            className="video-player"
                        />
                    </div>

                    <div className="video-stats">
                        <div className="grid">
                            <div className="flex">
                                <span className="mr-2">📶</span>
                                <span>Download: <strong>{stats.downloadSpeed}</strong> kbps</span>
                            </div>
                            <div className="flex">
                                <span className="mr-2">📊</span>
                                <span>Buffer: <strong>{stats.bufferLevel}</strong> sec</span>
                            </div>
                            <div className="flex">
                                <span className="mr-2">🎞</span>
                                <span>Bitrate: <strong>{stats.bitrate}</strong> kbps</span>
                            </div>
                            <div className="flex">
                                <span className="mr-2">📉</span>
                                <span>Dropped: <strong>{stats.droppedFrames}</strong> frames</span>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="player-placeholder">
                    <p>Enter a video ID to start playback</p>
                </div>
            )}
        </div>
    );
};

export default DashPlayer;