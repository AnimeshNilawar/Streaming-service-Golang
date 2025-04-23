import { useParams, useLocation } from 'react-router-dom';
import DashPlayer from './DashPlayer';
import '../styles/VideoPage.css';

const VideoPage = () => {
    const { videoId } = useParams();
    const location = useLocation();

    // Get video details from navigation state, or use videoId as fallback
    const videoData = location.state || { videoId };

    return (
        <div className="video-page-container">
            <div className="video-player-container">
                <DashPlayer
                    initialVideoId={videoData.videoId}
                    dashUrl={`http://localhost:8080/static/${videoData.videoId}_dash/manifest.mpd`}
                    autoPlay={true}
                />
            </div>
        </div>
    );
};

export default VideoPage;