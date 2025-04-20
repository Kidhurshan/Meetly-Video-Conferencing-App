// src/components/MeetingRoom.tsx
import { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Users, Maximize, Minimize, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import ChatPanel from './ChatPanel';
import { useWebRTC } from '../services/webrtc';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface MeetingRoomProps { roomId: string; userId: string; userName: string; }

const MeetingRoom = ({ roomId, userId, userName }: MeetingRoomProps) => {
  const { localStream, peers, isConnectedToPeerJS, isSignalingConnected, error, isAudioEnabled, isVideoEnabled, messages, toggleAudio, toggleVideo, sendChatMessage, leaveRoom } = useWebRTC(roomId, userId, userName);
  console.log("[MeetingRoom] Rendering. Peer IDs in state:", peers.map(p => p.id)); // Keep for debug
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'focus'>('grid');
  const [focusedPeerId, setFocusedPeerId] = useState<string | 'local'>('local');
  const navigate = useNavigate();

  useEffect(() => { /* ... Log status/error ... */ }, [isConnectedToPeerJS, isSignalingConnected, error, toast]);
  const handleLeaveRoom = () => { leaveRoom(); navigate('/'); };
  const toggleViewMode = () => { setViewMode(prev => prev === 'grid' ? 'focus' : 'grid'); };
  const focusOnPeer = (peerId: string | 'local') => { setFocusedPeerId(peerId); setViewMode('focus'); };
  const copyRoomId = () => { navigator.clipboard.writeText(roomId).then(() => toast({ description: "Room code copied!" })).catch(err => toast({ description: "Failed to copy code.", variant: "destructive" })); };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-2 flex-shrink-0">
        {/* ... Header content (Room ID, Copy Button) ... */}
         <div className="flex items-center gap-2">
           <h1 className="text-lg sm:text-xl font-bold text-meetly-purple">Meetly</h1>
           <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
             Room: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{roomId}</span>
             <Button variant="ghost" size="icon" onClick={copyRoomId} className="h-6 w-6" title="Copy Room Code"><Copy size={14} /></Button>
           </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={toggleViewMode} title={viewMode === 'grid' ? "Focus View" : "Grid View"} className="h-8 text-xs px-2">
            {viewMode === 'grid' ? <Maximize size={14} className="mr-1" /> : <Minimize size={14} className="mr-1" />}
            {viewMode === 'grid' ? 'Focus' : 'Grid'}
          </Button>
          <div className="text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full flex items-center h-8">
            <Users size={14} className="mr-1" /> {peers.length + 1}
          </div>
          <div title={`Signaling: ${isSignalingConnected ? 'On' : 'Off'} / PeerJS: ${isConnectedToPeerJS ? 'On' : 'Off'}`}
               className={`w-3 h-3 rounded-full flex-shrink-0 ${isSignalingConnected && isConnectedToPeerJS ? 'bg-green-500 animate-pulse-light' : isSignalingConnected ? 'bg-yellow-500' : 'bg-red-500'}`}
           />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className={`p-2 sm:p-4 flex-1 overflow-auto transition-all duration-300 ease-in-out ${showChat ? 'w-full lg:w-3/4 flex-shrink' : 'w-full'}`}>
          {viewMode === 'grid' ? (
            <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {/* Local Video */}
              <div key="local-video-grid" onClick={() => focusOnPeer('local')} className="cursor-pointer transition-transform hover:scale-[1.01] rounded-lg overflow-hidden shadow-md bg-black">
                <VideoPlayer stream={localStream} name={userName} muted={true} isLocal={true} isVideoEnabled={isVideoEnabled} isAudioEnabled={isAudioEnabled} />
              </div>
              {/* Remote Videos */}
              {peers.map((peer) => (
                <div key={peer.id} onClick={() => focusOnPeer(peer.id)} className="cursor-pointer transition-transform hover:scale-[1.01] rounded-lg overflow-hidden shadow-md bg-black">
                  <VideoPlayer stream={peer.stream || null} name={peer.name} isVideoEnabled={true} isAudioEnabled={true} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Focused Video */}
              <div className="flex-1 mb-2 sm:mb-4 rounded-lg overflow-hidden shadow-lg bg-black">
                 {focusedPeerId === 'local' ? (
                   <VideoPlayer stream={localStream} name={userName} muted={true} isLocal={true} isVideoEnabled={isVideoEnabled} isAudioEnabled={isAudioEnabled} />
                 ) : (
                   <VideoPlayer stream={peers.find(p => p.id === focusedPeerId)?.stream ?? null} name={peers.find(p => p.id === focusedPeerId)?.name || 'Peer'} isVideoEnabled={true} isAudioEnabled={true} />
                 )}
              </div>
              {/* Thumbnails */}
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent flex-shrink-0">
                 {focusedPeerId !== 'local' && ( <div key="local-video-thumb" className="w-32 sm:w-40 h-auto flex-shrink-0 cursor-pointer rounded-md overflow-hidden shadow bg-black" onClick={() => setFocusedPeerId('local')}> <VideoPlayer stream={localStream} name={userName} muted={true} isLocal={true} isVideoEnabled={isVideoEnabled} isAudioEnabled={isAudioEnabled} /> </div> )}
                 {peers.map((peer) => ( peer.id !== focusedPeerId && ( <div key={peer.id} className="w-32 sm:w-40 h-auto flex-shrink-0 cursor-pointer rounded-md overflow-hidden shadow bg-black" onClick={() => setFocusedPeerId(peer.id)}> <VideoPlayer stream={peer.stream || null} name={peer.name} isVideoEnabled={true} isAudioEnabled={true} /> </div> ))) }
              </div>
            </div>
          )}
        </div>
        {/* Chat Sidebar */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${showChat ? 'w-full mt-4 lg:mt-0 lg:w-1/4 border-l border-gray-200 dark:border-gray-700 flex-shrink-0' : 'w-0'}`}>
           {showChat && ( <ChatPanel messages={messages} onSendMessage={sendChatMessage} userId={userId} /> )}
        </div>
      </div>
      {/* Controls Footer */}
      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center space-x-2 sm:space-x-4 flex-wrap flex-shrink-0">
        {/* ... Control Buttons ... */}
        <Button onClick={toggleAudio} variant={isAudioEnabled ? "outline" : "destructive"} size="icon" className="rounded-full w-10 h-10 sm:w-12 sm:h-12" title={isAudioEnabled ? "Mute" : "Unmute"}>{isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}</Button>
        <Button onClick={toggleVideo} variant={isVideoEnabled ? "outline" : "destructive"} size="icon" className="rounded-full w-10 h-10 sm:w-12 sm:h-12" title={isVideoEnabled ? "Cam Off" : "Cam On"}>{isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}</Button>
        <Button onClick={() => setShowChat(!showChat)} variant={showChat ? "secondary" : "outline"} size="icon" className="rounded-full w-10 h-10 sm:w-12 sm:h-12" title={showChat ? "Hide Chat" : "Show Chat"}><MessageSquare size={20} /></Button>
        <Button onClick={handleLeaveRoom} variant="destructive" className="rounded-full px-4 sm:px-6 h-10 sm:h-12">Leave</Button>
      </div>
    </div>
  );
};
export default MeetingRoom;