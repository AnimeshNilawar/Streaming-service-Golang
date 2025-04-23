import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as dashjs from 'dashjs';
import '../styles/VideoPage.css';

const VideoPage = () => {
    const { videoId } = useParams();
    const [videoData, setVideoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideoData = async () => {
            try {
                // Fetch video details from the server
                const response = await fetch(`http://localhost:8080/video/${videoId}/details`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch video details: ${response.status}`);
                }

                const data = await response.json();
                setVideoData(data);
            } catch (err) {
                console.error('Error fetching video data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (videoId) {
            fetchVideoData();
        }
    }, [videoId]);

    if (loading) {
        return <div className="video-page-container loading">Loading video...</div>;
    }

    if (error) {
        return <div className="video-page-container error">Error: {error}</div>;
    }

    if (!videoData) {
        return <div className="video-page-container error">Video not found</div>;
    }

    return (
        <div className="video-page-container">
            <div className="video-header">
                <h1 className="video-title">{videoData.name || 'Untitled Video'}</h1>
                <div className="video-meta">
                    <span className="video-duration">Duration: {formatDuration(videoData.duration)}</span>
                    <span className="video-id">ID: {videoData.video_id}</span>
                </div>
            </div>

            <div className="video-player-container">
                <EnhancedDashPlayer 
                    videoId={videoData.video_id} 
                    thumbnail={`http://localhost:8080${videoData.thumbnail}`}
                    dashUrl={`http://localhost:8080${videoData.dash_url}`} 
                />
            </div>

            <div className="video-details">
                <div className="video-links">
                    <h3>Video Links</h3>
                    <div className="link-item">
                        <span className="link-label">DASH URL:</span>
                        <a href={`http://localhost:8080${videoData.dash_url}`} target="_blank" rel="noopener noreferrer">
                            {videoData.dash_url}
                        </a>
                    </div>
                    <div className="link-item">
                        <span className="link-label">HLS URL:</span>
                        <a href={`http://localhost:8080${videoData.hls_url}`} target="_blank" rel="noopener noreferrer">
                            {videoData.hls_url}
                        </a>
                    </div>
                    <div className="link-item">
                        <span className="link-label">Thumbnail:</span>
                        <a href={`http://localhost:8080${videoData.thumbnail}`} target="_blank" rel="noopener noreferrer">
                            {videoData.thumbnail}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Enhanced component with fixed size and quality controls
const EnhancedDashPlayer = ({ videoId, thumbnail, dashUrl }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(null);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [autoQuality, setAutoQuality] = useState(true);
    const [playerError, setPlayerError] = useState(null);
    const [stats, setStats] = useState({
        downloadSpeed: 0,
        bufferLevel: 0,
        bitrate: 0,
        droppedFrames: 0
    });

    // Toggle quality menu visibility
    const toggleQualityMenu = () => {
        setShowQualityMenu(!showQualityMenu);
    };

    // Handle quality selection
    const handleQualityChange = (index) => {
        if (!playerRef.current) return;
        
        if (index === -1) {
            // Auto quality
            playerRef.current.setAutoSwitchQualityFor('video', true);
            setAutoQuality(true);
        } else {
            // Manual quality selection
            playerRef.current.setAutoSwitchQualityFor('video', false);
            playerRef.current.setQualityFor('video', index);
            setAutoQuality(false);
        }
        
        setCurrentQuality(index);
        setShowQualityMenu(false);
    };

    // Format bitrate for display (e.g., 2500 -> "2.5 Mbps")
    const formatBitrate = (bitrateKbps) => {
        if (bitrateKbps >= 1000) {
            return `${(bitrateKbps / 1000).toFixed(1)} Mbps`;
        }
        return `${bitrateKbps} Kbps`;
    };

    // Format resolution for display
    const formatResolution = (width, height) => {
        if (height >= 2160) return '4K';
        if (height >= 1440) return '1440p';
        if (height >= 1080) return '1080p';
        if (height >= 720) return '720p';
        if (height >= 480) return '480p';
        if (height >= 360) return '360p';
        if (height >= 240) return '240p';
        return `${width}x${height}`;
    };

    // Test if a URL exists (for debugging)
    const checkUrlExists = async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    useEffect(() => {
        if (!videoId || !videoRef.current) return;
        
        // Use the direct dash URL if provided, otherwise build it from videoId
        const sourceUrl = dashUrl || `http://localhost:8080/static/${videoId}_dash/manifest.mpd`;
        console.log(`Loading video from: ${sourceUrl}`);

        // Check if the manifest exists
        checkUrlExists(sourceUrl).then(exists => {
            if (!exists) {
                console.error(`Manifest not found at: ${sourceUrl}`);
                setPlayerError(`The video manifest could not be found. Please check if the server is running.`);
            }
        });

        // Clean up previous player instance if it exists
        if (playerRef.current) {
            playerRef.current.reset();
            playerRef.current = null;
        }

        // Initialize player
        const player = dashjs.MediaPlayer().create();
        
        // Set initial configuration
        player.updateSettings({
            'streaming': {
                'fastSwitchEnabled': true,
                'abr': {
                    'autoSwitchBitrate': {
                        'video': true
                    }
                }
            }
        });
        
        // Add error handlers
        player.on(dashjs.MediaPlayer.events.ERROR, (error) => {
            console.error('DASH player error:', error);
            if (error.error === 'download') {
                setPlayerError(`Failed to load video: ${error.event.url || 'manifest file'} (${error.event.request.status})`);
            } else {
                setPlayerError(`Video playback error: ${error.error}`);
            }
        });
        
        player.on(dashjs.MediaPlayer.events.MANIFEST_LOADING_FAILED, (error) => {
            console.error('Manifest loading failed:', error);
            setPlayerError(`Failed to load manifest file. Check if the server is running.`);
        });

        player.initialize(videoRef.current, sourceUrl, true);
        playerRef.current = player;

        // Set up event listener for when the manifest is loaded
        player.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, () => {
            console.log('Manifest loaded successfully');
            setPlayerError(null);
            
            // Get available video qualities
            const bitrateList = player.getBitrateInfoListFor('video') || [];
            
            // Sort by bitrate (descending)
            const sortedBitrateList = [...bitrateList].sort((a, b) => b.bitrate - a.bitrate);
            
            // Format for display
            const qualityOptions = sortedBitrateList.map((item, index) => ({
                index: item.qualityIndex,
                bitrate: item.bitrate,
                width: item.width,
                height: item.height,
                label: `${formatResolution(item.width, item.height)} (${formatBitrate(Math.round(item.bitrate / 1000))})`
            }));
            
            setQualities(qualityOptions);
            setAutoQuality(true);
        });

        // Keep track of current quality and update stats
        const statsInterval = setInterval(() => {
            if (!player) return;

            try {
                // Update current quality
                if (typeof player.getQualityFor === 'function') {
                    const qualityIdx = player.getQualityFor('video');
                    setCurrentQuality(autoQuality ? -1 : qualityIdx);
                }

                // Get metrics
                const dashMetrics = player.getDashMetrics();

                // Buffer level
                let bufferLevel = 0;
                try {
                    bufferLevel = dashMetrics.getCurrentBufferLevel('video') || 0;
                } catch (e) {
                    console.log('Error getting buffer level:', e);
                }

                // Get bitrate info
                let bitrate = 0;
                try {
                    if (typeof player.getQualityFor === 'function') {
                        const qualityIdx = player.getQualityFor('video');
                        const bitrateList = player.getBitrateInfoListFor ? 
                            player.getBitrateInfoListFor('video') : 
                            player.getTopBitrateInfoFor ? [player.getTopBitrateInfoFor('video')] : [];

                        if (bitrateList && bitrateList[qualityIdx]) {
                            bitrate = Math.round(bitrateList[qualityIdx].bitrate / 1000);
                        }
                    } else if (typeof player.getAverageThroughput === 'function') {
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
            clearInterval(statsInterval);
            if (playerRef.current) {
                playerRef.current.reset();
                playerRef.current = null;
            }
        };
    }, [videoId, dashUrl]);

    return (
        <>
            {playerError && (
                <div className="error-message">
                    {playerError}
                </div>
            )}
        
            <div className="player-container">
                <video
                    ref={videoRef}
                    controls
                    controlsList="nodownload"
                    className="video-player"
                    poster={thumbnail}
                    crossOrigin="anonymous"
                />
                
                {/* Quality selector */}
                <div className="quality-control">
                    <button 
                        className="quality-button" 
                        onClick={toggleQualityMenu}
                        title="Quality Settings"
                    >
                        <span className="gear-icon">⚙️</span>
                        {autoQuality 
                            ? 'Auto' 
                            : currentQuality !== null && qualities[qualities.findIndex(q => q.index === currentQuality)]
                                ? qualities[qualities.findIndex(q => q.index === currentQuality)].label.split(' ')[0]
                                : 'Quality'
                        }
                    </button>
                    
                    {showQualityMenu && (
                        <div className="quality-menu">
                            <div className="quality-menu-header">
                                <span>Quality</span>
                            </div>
                            <ul className="quality-options">
                                <li 
                                    className={autoQuality ? 'active' : ''}
                                    onClick={() => handleQualityChange(-1)}
                                >
                                    Auto
                                </li>
                                {qualities.map((quality) => (
                                    <li 
                                        key={quality.index}
                                        className={!autoQuality && currentQuality === quality.index ? 'active' : ''}
                                        onClick={() => handleQualityChange(quality.index)}
                                    >
                                        {quality.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Video statistics display */}
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
            
            {/* Debug link */}
            <div className="debug-link">
                <a 
                    href={dashUrl || `http://localhost:8080/static/${videoId}_dash/manifest.mpd`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Test manifest file directly"
                >
                    Test Manifest
                </a>
            </div>
        </>
    );
};

// Helper function to format duration
const formatDuration = (durationStr) => {
    const duration = parseFloat(durationStr);
    if (isNaN(duration)) return durationStr;

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default VideoPage;