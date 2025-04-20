import { useEffect, useState } from 'react'; // Added useState
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import MeetingRoom from '../components/MeetingRoom';
import { useToast } from "@/hooks/use-toast"; // Use the correct hook

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State to hold validated user/room info
  const [userInfo, setUserInfo] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    console.log("Room component mounted. RoomId from URL:", roomId);
    console.log("Location state:", location.state);

    // --- Validation ---
    if (!roomId) {
      console.error("No room ID provided in URL.");
      toast({
        title: "Room Error",
        description: "No room ID provided.",
        variant: "destructive",
      });
      navigate('/', { replace: true });
      return;
    }

    // Prioritize location state passed from Home
    let currentUserName = location.state?.userName;
    let currentUserId = location.state?.userId;

    console.log("User info from state:", { currentUserName, currentUserId });

    // Fallback to storage IF state is missing (e.g., page refresh)
    if (!currentUserName) {
      currentUserName = localStorage.getItem('userName'); // Keep userName persistent
      console.log("User name retrieved from localStorage:", currentUserName);
    }
    if (!currentUserId) {
      currentUserId = sessionStorage.getItem('sessionUserId'); // Use sessionStorage for userId
      console.log("User ID retrieved from sessionStorage:", currentUserId);
      // If still no userId, generate one (should ideally not happen if Home page logic ran)
      if (!currentUserId) {
         console.warn("No user ID found in state or session storage. Generating new one.");
         // It's better to redirect to Home if this happens often,
         // but for robustness let's try generating.
         // This might lead to ID mismatches if not handled carefully.
         // A better approach might be *forcing* redirection to Home.
         // For now, let's redirect:
         toast({
           title: "Session Error",
           description: "Could not find your user session. Please rejoin.",
           variant: "destructive"
         });
         navigate('/', {
           replace: true,
           state: { roomIdToJoin: roomId }
         });
         return;
      }
    }

    // Final check
    if (!currentUserName) {
      console.error("User name is missing. Redirecting to Home.");
      toast({
        title: "Sign In Required",
        description: "Please enter your name to join the room.",
        variant: "destructive",
      });
      navigate('/', {
        replace: true,
        state: { roomIdToJoin: roomId }, // Pass roomId back to Home
      });
      return;
    }

    console.log(`Validated User Info - Room: ${roomId}, Name: ${currentUserName}, ID: ${currentUserId}`);

    // If all checks pass, set the user info state
    setUserInfo({ userName: currentUserName, userId: currentUserId });

    // Save to storage (userName to localStorage, userId to sessionStorage)
    localStorage.setItem('userName', currentUserName);
    sessionStorage.setItem('sessionUserId', currentUserId); // Ensure session storage is up-to-date

  }, [roomId, location.state, navigate, toast]); // Dependencies


  // Render MeetingRoom only when userInfo is validated and set
  if (!userInfo) {
    // Optionally show a loading indicator
    return <div className="flex items-center justify-center h-screen gradient-bg text-white">Loading room...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <MeetingRoom
        roomId={roomId!} // We've checked roomId is defined
        userId={userInfo.userId}
        userName={userInfo.userName}
      />
    </div>
  );
};

export default Room;