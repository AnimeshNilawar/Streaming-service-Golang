import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UploadPage.css';

const UploadPage = () => {
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [videoName, setVideoName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [serverError, setServerError] = useState('');
    const [uploadedVideoId, setUploadedVideoId] = useState(null);
    const navigate = useNavigate();

    const handleVideoChange = (e) => {
        setVideoFile(e.target.files[0]);
    };

    const handleThumbnailChange = (e) => {
        setThumbnailFile(e.target.files[0]);
    };

    const handleNameChange = (e) => {
        setVideoName(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!videoFile || !thumbnailFile || !videoName) {
            setMessage('Please provide all required fields: video, thumbnail, and name');
            return;
        }

        setIsUploading(true);
        setMessage('Uploading...');
        setServerError('');
        setUploadedVideoId(null);

        try {
            const formData = new FormData();
            formData.append('file', videoFile);
            formData.append('thumbnail', thumbnailFile);
            formData.append('video_name', videoName);

            console.log('Files being sent:',
                `Video: ${videoFile.name} (${videoFile.size} bytes)`,
                `Thumbnail: ${thumbnailFile.name} (${thumbnailFile.size} bytes)`,
                `Name: ${videoName}`
            );

            const response = await fetch('http://localhost:8080/upload', {
                method: 'POST',
                body: formData,
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (err) {
                console.log('Response is not JSON:', await response.text());
                responseData = { error: 'Invalid response format from server' };
            }

            if (response.ok) {
                setMessage('Upload successful!');
                setVideoFile(null);
                setThumbnailFile(null);
                setVideoName('');
                // Reset file inputs
                document.getElementById('video-upload').value = '';
                document.getElementById('thumbnail-upload').value = '';

                // Save the video ID from the response and display link
                if (responseData.video_id) {
                    setUploadedVideoId(responseData.video_id);
                }
            } else {
                setServerError(responseData.error || responseData.message || 'Unknown error');
                setMessage(`Upload failed: ${responseData.error || responseData.message || 'Unknown error'}`);
                console.error('Server response:', responseData);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const goToVideo = () => {
        if (uploadedVideoId) {
            navigate(`/video/${uploadedVideoId}`);
        }
    };

    return (
        <div className="upload-container">
            <h2 className="upload-title">Upload Video</h2>

            {message && (
                <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {serverError && (
                <div className="message error">
                    <strong>Server Error:</strong> {serverError}
                </div>
            )}

            {uploadedVideoId ? (
                <div className="upload-success-message">
                    <p>Your video has been uploaded successfully!</p>
                    <button onClick={goToVideo} className="video-link">
                        View Your Video
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="video-upload">
                            Video File (MP4, WebM, etc.)
                        </label>
                        <input
                            id="video-upload"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="thumbnail-upload">
                            Thumbnail Image (JPG, PNG)
                        </label>
                        <input
                            id="thumbnail-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="video-name">
                            Video Name
                        </label>
                        <input
                            id="video-name"
                            type="text"
                            value={videoName}
                            onChange={handleNameChange}
                            placeholder="Enter a name for your video"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className={isUploading ? 'button-disabled' : ''}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Video'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default UploadPage;