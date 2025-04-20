import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateRoomId, generateUserId } from '../utils/helpers'; // Ensure correct import
import { toast } from "@/hooks/use-toast"; // Use the correct toast hook

const Home = () => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Load saved username if available
  useEffect(() => {
    const savedName = localStorage.getItem('userName'); // Keep username in localStorage
    if (savedName) {
      setUserName(savedName);
    }

    // Check if coming back with a room ID to join
    const roomIdToJoin = location.state?.roomIdToJoin;
    if (roomIdToJoin) {
      setRoomId(roomIdToJoin);
      setIsCreating(false);
      // Optionally show a toast message
      toast({
        title: "Enter Room Code",
        description: `Please enter your name to join room ${roomIdToJoin}.`,
      });
    }
  }, [location.state, toast]); // Added toast to dependency array

  const validateAndProceed = (targetRoomId: string) => {
     if (!userName.trim()) {
      toast({ title: "Name Required", description: "Please enter your name.", variant: "destructive" });
      return false;
    }
     if (!targetRoomId || !targetRoomId.trim()) {
       toast({ title: "Room Code Required", description: "Please enter or generate a room code.", variant: "destructive" });
       return false;
     }

     // Generate a user ID specifically for this session/tab
     const userId = generateUserId(); // This now uses sessionStorage internally

     // Store username persistently across sessions/tabs
     localStorage.setItem('userName', userName);
     // sessionStorage for userId is handled by generateUserId

     console.log(`Navigating to room ${targetRoomId.toUpperCase()} with userName: ${userName}, userId: ${userId}`);
     navigate(`/room/${targetRoomId.toUpperCase()}`, {
       state: { userName, userId } // Pass explicitly via state
     });
     return true;
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndProceed(roomId);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoomId = generateRoomId();
    validateAndProceed(newRoomId);
  };


  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="meetly-card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-meetly-purple to-meetly-darkPurple">
              Meetly
            </span>
          </h1>
          <p className="text-gray-600 mt-2">Video conferencing project</p>
        </div>

        {isCreating ? (
          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div>
              <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                id="create-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="meetly-input"
                placeholder="Enter your name"
                required
              />
            </div>

            <button type="submit" className="w-full meetly-btn">
              Create New Room
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-gray-600 text-sm hover:text-meetly-purple"
              >
                Join an existing room instead
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label htmlFor="join-name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                id="join-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="meetly-input"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label htmlFor="room-code" className="block text-sm font-medium text-gray-700 mb-1">
                Room Code
              </label>
              <input
                id="room-code"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="meetly-input"
                placeholder="Enter room code to join"
                maxLength={6} // Keep max length
                pattern="[A-Z0-9]{6}" // Add pattern for validation (optional but good)
                title="Room code must be 6 uppercase letters or numbers"
                required
              />
            </div>

            <button type="submit" className="w-full meetly-btn">
              Join Room
            </button>

            <div className="text-center">
              <div className="my-2 text-sm text-gray-500">OR</div>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="text-gray-600 text-sm hover:text-meetly-purple"
              >
                Create a new room instead
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Home;