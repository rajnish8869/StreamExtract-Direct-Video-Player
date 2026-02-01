import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  type: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, type }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => {
          console.warn("Autoplay blocked:", e);
      });
    }
  }, [src]);

  const handleOnError = () => {
    console.error("Video failed to load natively.");
    // In a production app, we might fallback to HLS.js here if the browser doesn't support native HLS
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        controls
        preload="metadata"
        poster={poster}
        className="w-full h-full object-contain"
        onError={handleOnError}
      >
        <source src={src} type={type} />
        <p className="text-white p-4 text-center">
            Your browser does not support the HTML5 Video element.
        </p>
      </video>
    </div>
  );
};

export default VideoPlayer;