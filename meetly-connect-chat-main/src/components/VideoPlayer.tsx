import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react'; // Added User icon

interface VideoPlayerProps {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  isLocal?: boolean;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
}

const VideoPlayer = ({
  stream,
  name,
  muted = false,
  isLocal = false,
  isVideoEnabled = true,
  isAudioEnabled = true,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false); // Track if video is rendering
  const [errorState, setErrorState] = useState<string | null>(null);


  useEffect(() => {
    let mounted = true;
    setErrorState(null); // Reset error on stream change
    setIsActuallyPlaying(false); // Reset playing state

    if (!videoRef.current) return;

    const videoElement = videoRef.current;

    const handleCanPlay = () => {
      if (mounted) setIsActuallyPlaying(true);
      console.log(`Video can play for ${name}`);
    };
    const handlePlaying = () => {
      if (mounted) setIsActuallyPlaying(true);
      console.log(`Video is playing for ${name}`);
    };
    const handleError = (e: Event | string) => {
       console.error(`Video error for ${name}:`, e);
       if (mounted) {
           setErrorState("Video stream error");
           setIsActuallyPlaying(false);
       }
    }
    const handleStreamInactive = () => {
        console.warn(`Stream inactive for ${name}`);
        if (mounted) {
            setErrorState("Stream ended");
            setIsActuallyPlaying(false);
            videoElement.srcObject = null; // Clear srcObject if stream ends
        }
    }

    if (stream && stream.active) {
      console.log(`Attaching stream ${stream.id} to video element for ${name}`);
      videoElement.srcObject = stream;
      videoElement.muted = muted; // Ensure muted state is set correctly

      // Add listeners
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('playing', handlePlaying);
      videoElement.addEventListener('error', handleError);
      stream.addEventListener('inactive', handleStreamInactive);


      // Attempt to play
       videoElement.play().catch(err => {
         console.warn(`Autoplay failed for ${name}:`, err.name, err.message);
         // Don't set error state here, browser might require user interaction
         if (mounted) setIsActuallyPlaying(false); // Ensure playing state reflects reality
       });

    } else {
      console.log(`No active stream to attach for ${name}`);
      videoElement.srcObject = null;
      if(stream === null) setErrorState(null); // Clear error if stream is intentionally null
      else if (!stream?.active) setErrorState("Stream inactive");
    }

    // Cleanup
    return () => {
      mounted = false;
      console.log(`Cleaning up video element for ${name}`);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('error', handleError);
      stream?.removeEventListener('inactive', handleStreamInactive);
      // Don't null srcObject here if stream itself is still valid, parent component manages stream lifecycle
      // videoElement.srcObject = null;
    };
  }, [stream, name, muted]); // Dependency on stream

  // Handle isVideoEnabled changes separately
  useEffect(() => {
      if(videoRef.current) {
          videoRef.current.style.display = isVideoEnabled ? 'block' : 'none';
      }
  }, [isVideoEnabled]);

  const showPlaceholder = !stream || !isVideoEnabled || errorState || !isActuallyPlaying;

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video h-full w-full flex items-center justify-center">
      {/* Video Element (conditionally hidden via CSS or rendering) */}
      <video
          ref={videoRef}
          playsInline // Important for mobile
          className={`w-full h-full object-cover ${isVideoEnabled && stream && stream.active ? 'block' : 'hidden'}`} // Use CSS to hide if needed
          // autoPlay removed, handled by effect
      />

      {/* Placeholder */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-white">
          <div className="flex flex-col items-center justify-center text-center p-2">
             <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-600 flex items-center justify-center mb-2">
                 <User size={32} /> {/* Generic user icon */}
             </div>
            {errorState ? (
              <p className="text-red-400 text-xs sm:text-sm">{errorState}</p>
            ) : !isVideoEnabled ? (
               <p className="text-xs sm:text-sm">Camera Off</p>
            ) : !stream || !stream.active ? (
               <p className="text-xs sm:text-sm">Connecting...</p>
            ) : (
               <p className="text-xs sm:text-sm">Loading Video...</p> // Fallback text
            )}
            <p className="text-xs sm:text-sm font-medium truncate mt-1">{name} {isLocal && "(You)"}</p>
          </div>
        </div>
      )}

      {/* Overlay Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2 flex justify-between items-end pointer-events-none">
        <span className="text-xs sm:text-sm font-medium text-white shadow-black/50 [text-shadow:_0_1px_2px_var(--tw-shadow-color)] truncate">
          {/* Name is now shown in placeholder too, maybe remove from here or keep */}
          {/* {name} {isLocal && "(You)"} */}
        </span>
        <div className="flex space-x-1 items-center">
          {!isAudioEnabled && (
            <span className="rounded-full bg-red-500/80 p-1 flex items-center justify-center pointer-events-auto backdrop-blur-sm" title="Microphone Muted">
              <MicOff size={12} className="text-white" />
            </span>
          )}
          {/* We don't need the VideoOff indicator here as the placeholder shows it */}
          {/* {!isVideoEnabled && (
            <span className="rounded-full bg-red-500/80 p-1 flex items-center justify-center pointer-events-auto backdrop-blur-sm" title="Camera Off">
              <VideoOff size={12} className="text-white"/>
            </span>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;