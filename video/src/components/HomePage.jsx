import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await fetch('http://localhost:8080/videos', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch videos: ${response.status}`);
                }

                const data = await response.json();
                setVideos(data.videos || []);
            } catch (err) {
                console.error('Error fetching videos:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    const formatDuration = (duration) => {
        if (!duration) return '00:00';

        // Remove any newline characters
        const seconds = parseFloat(duration.replace('\n', ''));
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Extract thumbnail filename from full path
    const getThumbnailUrl = (thumbnailPath) => {
        if (!thumbnailPath) return '';

        // The thumbnail path in the response is like:
        // C:/Users/anime/Downloads/dsa/WT-CP/static/thumbnails/93964f20-b4c4-496a-857b-5200af37e62c.png

        // We can either:
        // 1. Extract the ID from the path and use endpoint /thumbnail/{id}
        // 2. Or use the filename directly with a proper endpoint

        // Option 1: Extract ID from filename
        const filename = thumbnailPath.split('/').pop();
        const id = filename.split('.')[0];
        return `http://localhost:8080/thumbnail/${id}`;
    };

    if (loading) {
        return <div className="videos-container loading">Loading videos...</div>;
    }

    if (error) {
        return <div className="videos-container error">Error: {error}</div>;
    }

    if (videos.length === 0) {
        return <div className="videos-container empty">No videos found. Upload some videos to get started!</div>;
    }

    return (
        <div className="home-container">
            <h2>Available Videos</h2>
            <div className="videos-grid">
                {videos.map(video => (
                    <Link
                        to={`/video/${video.id}`}
                        key={video.id}
                        className="video-card"
                        state={{
                            videoId: video.id,
                            name: video.name,
                            duration: video.duration,
                            timestamp: video.timestamp,
                            thumbnail: video.thumbnail
                        }}
                    >
                        <div className="thumbnail-container">
                            <img
                                src={getThumbnailUrl(video.thumbnail)}
                                alt={video.name}
                                className="video-thumbnail"
                            />
                            <span className="video-duration">{formatDuration(video.duration)}</span>
                        </div>
                        <div className="video-info">
                            <h3 className="video-title">{video.name}</h3>
                            <p className="video-date">{formatDate(video.timestamp)}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default HomePage;