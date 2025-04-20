// src/services/webrtc.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { toast } from '@/hooks/use-toast'; // Ensure path is correct

// --- START: Configuration for Separate Signaling Server ---
// #####################################################################
// # CRITICAL: Replace 'YOUR_COMPUTER_IP_ADDRESS' below with the ACTUAL
// #            LOCAL IP address of the machine running the
// #            `node signaling-server.js` command (e.g., 192.168.1.100).
// #####################################################################
const YOUR_SIGNALING_SERVER_IP = '192.168.73.240'; // <--- *** CHANGE THIS LINE ***

const SIGNALING_SERVER_PORT = 3001; // Default port for the separate server
const SIGNALING_SERVER_URL = `wss://${YOUR_SIGNALING_SERVER_IP}:${SIGNALING_SERVER_PORT}`;

console.log("[useWebRTC] Target Signaling Server:", SIGNALING_SERVER_URL);
// --- END: Configuration ---

// --- Type Definitions ---
type PeerData = { id: string; name: string; stream?: MediaStream | null; connection?: MediaConnection | null; dataConnection?: DataConnection | null; };
export type Message = { sender: string; senderName: string; content: string; timestamp: Date; };
interface HandshakeMessage { type: 'handshake'; userId: string; userName: string; }
interface ChatMessage { type: 'chat-message'; userId: string; userName: string; content: string; timestamp: string; }
type DataMessage = HandshakeMessage | ChatMessage;
interface JoinRoomPayload { roomId: string; peerId: string; }
interface ClientMessage { type: 'join-room'; payload: JoinRoomPayload; }
interface RoomPeersPayload { peers: string[]; }
interface PeerJoinedPayload { peerId: string; }
interface PeerLeftPayload { peerId: string; }
type ServerMessageType = 'room-peers' | 'peer-joined' | 'peer-left' | 'error';
interface ServerErrorMessagePayload { message: string; }
interface ServerMessage { type: ServerMessageType; payload: RoomPeersPayload | PeerJoinedPayload | PeerLeftPayload | ServerErrorMessagePayload; }
// --- End Type Definitions ---

export const useWebRTC = (roomId: string, userId: string, userName: string) => {
  // --- State ---
  const [peers, setPeers] = useState<PeerData[]>([]); // This should always be an array
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnectedToPeerJS, setIsConnectedToPeerJS] = useState(false);
  const [isSignalingConnected, setIsSignalingConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  const peerRef = useRef<Peer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerData>>(new Map()); // Source of truth for connections
  const isInitializedRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // --- Centralized Cleanup ---
  const cleanup = useCallback(() => {
    console.log("[Cleanup] Running cleanup...");
    // isMountedRef.current = false; // Set this in useEffect return

    if (wsReconnectTimeoutRef.current) { clearTimeout(wsReconnectTimeoutRef.current); wsReconnectTimeoutRef.current = null; }
    if (wsRef.current) {
        console.log("[Cleanup] Closing WebSocket."); wsRef.current.onclose = null; wsRef.current.onerror = null; wsRef.current.onmessage = null; wsRef.current.onopen = null; if(wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close(1000, "Client Cleanup"); wsRef.current = null;
    }
    // Only update state if component might still be considered mounted during cleanup phase
    if (isMountedRef.current) setIsSignalingConnected(false);

    if (localStreamRef.current) {
        console.log("[Cleanup] Stopping local stream."); localStreamRef.current.getTracks().forEach(track => track.stop()); localStreamRef.current = null;
    }
    if (isMountedRef.current) setLocalStream(null);

    if (peerRef.current) {
        console.log("[Cleanup] Destroying PeerJS."); if (!peerRef.current.destroyed) { /* remove listeners */ peerRef.current.off('open'); peerRef.current.off('error'); peerRef.current.off('call'); peerRef.current.off('connection'); peerRef.current.off('disconnected'); peerRef.current.off('close'); peerRef.current.destroy(); } peerRef.current = null;
    }
    if (isMountedRef.current) setIsConnectedToPeerJS(false);

    peerConnectionsRef.current.clear();
    if (isMountedRef.current) { setPeers([]); setMessages([]); setError(null); }
    isInitializedRef.current = false;
    console.log("[Cleanup] Finished.");
  }, []); // No dependencies needed for cleanup logic itself

    // --- Helper to Update Peers State from Ref Map ---
    const updatePeersStateFromRef = useCallback(() => {
        if (!isMountedRef.current) return;
        const peersArray = Array.from(peerConnectionsRef.current.values());
        setPeers(peersArray);
    }, []); // No dependencies needed

    // --- Signaling: Send Message ---
    const sendSignalingMessage = useCallback((message: ClientMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else { console.error("WS not open, cannot send:", message); }
    }, []);

    // --- P2P: Handle Peer Disconnect ---
    const handlePeerDisconnect = useCallback((peerId: string, sourceType?: 'media' | 'data' | 'signaling') => {
        if (!isMountedRef.current) return;
        const peerData = peerConnectionsRef.current.get(peerId);
        if (!peerData) return;
        console.log(`[Disconnect] Handling ${peerId} (Source: ${sourceType})`);
        if (peerData.connection && sourceType !== 'media') { if (peerData.connection.open) try { peerData.connection.close(); } catch(e){} peerData.connection = null; }
        if (peerData.dataConnection && sourceType !== 'data') { if (peerData.dataConnection.open) try { peerData.dataConnection.close(); } catch(e){} peerData.dataConnection = null; }
        // Remove from the source of truth map
        const peerExisted = peerConnectionsRef.current.delete(peerId);
        // Update React state from the map only if deletion happened
        if(peerExisted) updatePeersStateFromRef();
        console.log(`[Disconnect] Peer ${peerId} removed.`);
        toast({ description: `${peerData.name || `Peer ${peerId.slice(-4)}`} left.` });
    }, [updatePeersStateFromRef]); // Depends on the state updater

    // --- P2P: Setup Data Connection ---
    const setupDataConnection = useCallback((conn: DataConnection) => {
        const peerId = conn.peer;
        if (!isMountedRef.current) { conn.close(); return; }
        console.log(`[Data Conn] Setting up with ${peerId}`);
        let peerData = peerConnectionsRef.current.get(peerId);
        if (!peerData) { console.warn(`[Data Conn] Unknown peer ${peerId}`); peerData = { id: peerId, name: `Peer ${peerId.slice(-4)}...` }; peerConnectionsRef.current.set(peerId, peerData); }
        peerData.dataConnection = conn;
        updatePeersStateFromRef(); // Update state after adding connection initially

        conn.on('open', () => { if (!isMountedRef.current) return; console.log(`[Data Conn] Open ${peerId}`); const handshake: HandshakeMessage = { type: 'handshake', userId, userName }; try { conn.send(handshake); } catch (e) { console.error("Handshake send error", e); } });
        conn.on('data', (data: unknown) => {
            if (!isMountedRef.current) return;
            try {
                const message = data as DataMessage;
                if (message.type === 'handshake') {
                    const p = peerConnectionsRef.current.get(peerId);
                    if (p && p.name !== message.userName) {
                        p.name = message.userName;
                        peerConnectionsRef.current.set(peerId, p); // Update map entry first
                        updatePeersStateFromRef();                 // Then update react state from map
                        toast({ description: `${message.userName} connected.` });
                    }
                } else if (message.type === 'chat-message') {
                    const newMessage: Message = { sender: message.userId, senderName: message.userName, content: message.content, timestamp: new Date(message.timestamp) };
                    if(isMountedRef.current) setMessages(prev => [...prev, newMessage]);
                }
            } catch(e){ console.error("[Data Conn] Data processing error", e); }
        });
        conn.on('close', () => { console.log(`[Data Conn] Closed ${peerId}`); if(isMountedRef.current) handlePeerDisconnect(peerId, 'data'); });
        conn.on('error', (err) => { console.error(`[Data Conn] Error ${peerId}:`, err); if(isMountedRef.current) handlePeerDisconnect(peerId, 'data'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, userName, handlePeerDisconnect, updatePeersStateFromRef]); // Use stable dependencies

    // --- P2P: Handle Incoming Media Call ---
    const handleIncomingCall = useCallback((call: MediaConnection) => {
        const peerId = call.peer;
        if (!isMountedRef.current) { call.close(); return; }
        if (!localStreamRef.current) { console.error(`[Media Call] Cannot answer ${peerId}: No local stream.`); call.close(); return; }
        console.log(`[Media Call] Handling incoming call from ${peerId}`);
        let peerData = peerConnectionsRef.current.get(peerId);
        if (!peerData) { console.warn(`[Media Call] Unknown peer ${peerId}`); peerData = { id: peerId, name: `Peer ${peerId.slice(-4)}...` }; peerConnectionsRef.current.set(peerId, peerData); }
        peerData.connection = call;
        updatePeersStateFromRef(); // Update state after adding connection

        call.on('stream', (remoteStream) => {
            if (!isMountedRef.current) return;
            console.log(`[Media Call] Stream received from ${peerId}`);
            const currentPeerData = peerConnectionsRef.current.get(peerId);
            if (currentPeerData) {
                currentPeerData.stream = remoteStream;
                peerConnectionsRef.current.set(peerId, currentPeerData); // Update map
                updatePeersStateFromRef();                             // Update state
            }
        });
        call.on('close', () => { if(isMountedRef.current) handlePeerDisconnect(peerId, 'media'); });
        call.on('error', (err) => { if(isMountedRef.current) handlePeerDisconnect(peerId, 'media'); });

        call.answer(localStreamRef.current);
    }, [handlePeerDisconnect, updatePeersStateFromRef]); // Use stable dependencies

    // --- P2P: Initiate Connection ---
    const connectToPeer = useCallback((targetPeerId: string) => {
        if (!isMountedRef.current) return;
        if (!peerRef.current || peerRef.current.destroyed || !localStreamRef.current || targetPeerId === peerRef.current.id || peerConnectionsRef.current.has(targetPeerId)) return;
        console.log(`[Connect] Initiating P2P to ${targetPeerId}`);
        const peerData: PeerData = { id: targetPeerId, name: `Peer ${targetPeerId.slice(-4)}...` };
        peerConnectionsRef.current.set(targetPeerId, peerData);
        updatePeersStateFromRef(); // Add placeholder to UI

        try {
            const dataConn = peerRef.current.connect(targetPeerId, { reliable: true }); if (!dataConn) throw new Error("Data conn failed"); peerData.dataConnection = dataConn; setupDataConnection(dataConn);
            const mediaConn = peerRef.current.call(targetPeerId, localStreamRef.current); if (!mediaConn) throw new Error("Media call failed"); peerData.connection = mediaConn; handleIncomingCall(mediaConn);
            peerConnectionsRef.current.set(targetPeerId, peerData); // Update map with connections
        } catch (err: any) { console.error(`[Connect] Error connecting to ${targetPeerId}:`, err); if (isMountedRef.current) { toast({title:"Connect Error", description:`Failed to connect to ${targetPeerId.slice(-4)}`, variant:"destructive"}); } peerConnectionsRef.current.delete(targetPeerId); if (isMountedRef.current) { updatePeersStateFromRef(); } }
    }, [setupDataConnection, handleIncomingCall, updatePeersStateFromRef]); // Use stable dependencies

    // --- Signaling: Connect WebSocket ---
    const connectSignalingServer = useCallback((peerId: string) => {
        if (!isMountedRef.current) return;
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) { /* ... */ return; }
        if (wsReconnectTimeoutRef.current) { clearTimeout(wsReconnectTimeoutRef.current); wsReconnectTimeoutRef.current = null; }
        console.log(`[Signaling] Connecting WebSocket to: ${SIGNALING_SERVER_URL}`); setError(null);
        try { wsRef.current = new WebSocket(SIGNALING_SERVER_URL); } catch (e:any) { console.error("WS construct failed:", e); if(isMountedRef.current){setError(`WS Error: ${e.message}`);} return; }
        const ws = wsRef.current;

        ws.onopen = () => { if (!isMountedRef.current) { ws.close(); return; } console.log("[Signaling] WS Open."); setIsSignalingConnected(true); toast({ title: "Signaling Connected" }); sendSignalingMessage({ type: 'join-room', payload: { roomId, peerId } }); };
        ws.onmessage = (event) => {
            if (!isMountedRef.current) return;
            try {
                const message: ServerMessage = JSON.parse(event.data.toString());
                console.log("[Signaling] Received:", message.type);
                switch (message.type) {
                    case 'room-peers': const { peers } = message.payload as RoomPeersPayload; peers.forEach(id => connectToPeer(id)); break;
                    case 'peer-joined': const { peerId } = message.payload as PeerJoinedPayload; connectToPeer(peerId); break;
                    case 'peer-left': const { peerId: lId } = message.payload as PeerLeftPayload; handlePeerDisconnect(lId, 'signaling'); break;
                    case 'error': const { message: eMsg } = message.payload as ServerErrorMessagePayload; console.error("[Signaling] Server Error:", eMsg); if(isMountedRef.current){toast({title:"Signaling Error", description: eMsg, variant: "destructive"}); setError(`Signaling: ${eMsg}`);} break;
                    default: console.warn("[Signaling] Unknown server msg:", message.type);
                }
            } catch (e) { console.error("WS msg parse error:", e); }
        };
        ws.onclose = (event) => { console.warn(`[Signaling] WS Closed. Code: ${event.code}, Clean: ${event.wasClean}`); if (!isMountedRef.current) return; setIsSignalingConnected(false); wsRef.current = null; if (peerRef.current && !peerRef.current.destroyed && event.code !== 1000 && !wsReconnectTimeoutRef.current) { const delay = Math.random() * 2000 + 3000; wsReconnectTimeoutRef.current = setTimeout(() => { wsReconnectTimeoutRef.current = null; if (isMountedRef.current && peerRef.current && !peerRef.current.destroyed && peerRef.current.id) connectSignalingServer(peerRef.current.id); }, delay); } };
        ws.onerror = (error) => { console.error("[Signaling] WS Error:", error); if (!isMountedRef.current) return; setError("Signaling connection error."); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, sendSignalingMessage, connectToPeer, handlePeerDisconnect]); // Ensure stable dependencies


    // --- Main Initialization Effect ---
    useEffect(() => {
        isMountedRef.current = true; // Mark as mounted
        console.log("[Effect Init] Running main useEffect.");

        const initialize = async () => {
            if (!isMountedRef.current || isInitializedRef.current) return;
            isInitializedRef.current = true; console.log('[Initialize] Starting...'); setError(null);
            if (!navigator.mediaDevices?.getUserMedia || !window.WebSocket || YOUR_SIGNALING_SERVER_IP === 'YOUR_COMPUTER_IP_ADDRESS') { /* handle prerequisite check */
                 const errorMsg = !navigator.mediaDevices?.getUserMedia ? "getUserMedia not supported (HTTPS needed)." : !window.WebSocket ? "WebSockets not supported." : "Signaling server IP not configured."; console.error("[Initialize] Prerequisite failed:", errorMsg); if (isMountedRef.current) { setError(errorMsg); toast({ title: "Setup Error", description: errorMsg, variant: "destructive" }); } isInitializedRef.current = false; return;
            }

            try {
                console.log('[Initialize] Getting user media...');
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: { echoCancellation: true, noiseSuppression: true } }).catch(async err => await navigator.mediaDevices.getUserMedia({ audio: true, video: false }));
                if (!isMountedRef.current) { stream.getTracks().forEach(t=>t.stop()); return; }
                console.log("[Initialize] Media stream obtained:", stream.id);
                if (isMountedRef.current) setLocalStream(stream); localStreamRef.current = stream;

                const peerId = `${roomId}-${userId}`;
                console.log("[Initialize] Creating PeerJS:", peerId); if (peerRef.current) { peerRef.current.destroy(); }
                const peer = new Peer(peerId, { debug: 2, config: { iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun2.l.google.com:19302' }, { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject'}, { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject'}] }});
                peerRef.current = peer;

                peer.on('open', (id) => { if (!isMountedRef.current) return; console.log('[PeerJS] Open:', id); setIsConnectedToPeerJS(true); connectSignalingServer(id); });
                peer.on('error', (err) => { if (!isMountedRef.current) return; console.error('[PeerJS] Error:', err); setError(`PeerJS Error: ${err.type}`); toast({ title: `PeerJS Error: ${err.type}`, variant: "destructive" }); if (err.type === 'unavailable-id') cleanup(); else if (['network', 'server-error', 'socket-error', 'disconnected'].includes(err.type)) { if(isMountedRef.current) setIsConnectedToPeerJS(false); }});
                peer.on('call', (call) => { if (!isMountedRef.current || !localStreamRef.current) { call.close(); return; } handleIncomingCall(call); });
                peer.on('connection', (conn) => { if (!isMountedRef.current) { conn.close(); return; } setupDataConnection(conn); });
                peer.on('disconnected', () => { if (!isMountedRef.current) return; console.warn('[PeerJS] Disconnected'); if(isMountedRef.current) setIsConnectedToPeerJS(false); peerRef.current?.reconnect(); });
                peer.on('close', () => { if (!isMountedRef.current) return; console.log('[PeerJS] Closed'); if(isMountedRef.current) { setIsConnectedToPeerJS(false); setIsSignalingConnected(false); }});

            } catch (err:any) { if (!isMountedRef.current) return; console.error("[Initialize] Init failed:", err); setError(err.message); toast({ title: "Init Error", variant: "destructive" }); isInitializedRef.current = false; }
        };
        if (roomId && userId && userName) { initialize(); } else { console.error("Missing room/user info"); setError("Missing room/user info."); }

        // --- Effect Cleanup ---
        return () => { console.log("[useEffect Cleanup] Unmounting."); isMountedRef.current = false; cleanup(); };
    // Dependencies include stable callbacks needed *by the effect itself* (none in this case)
    // and the props that trigger re-initialization if they change.
    }, [roomId, userId, userName, cleanup, connectSignalingServer, handleIncomingCall, setupDataConnection]);


    // --- Actions exposed by the hook ---
    const sendChatMessage = useCallback((content: string) => { if (!isMountedRef.current || !content.trim()) return; const ts = new Date().toISOString(); const msg: ChatMessage = {type:'chat-message', userId, userName, content, timestamp:ts}; let count=0; peerConnectionsRef.current.forEach(p=>{ if(p.dataConnection?.open){ try{ p.dataConnection.send(msg); count++; }catch(e){console.error('chat send err',e);} } }); console.log(`[Chat] Sent to ${count} peers.`); if(isMountedRef.current) setMessages(prev => [...prev, {sender:userId, senderName:userName, content, timestamp: new Date(ts)}]); }, [userId, userName]);
    const toggleAudio = useCallback(() => { if (!isMountedRef.current || !localStreamRef.current) return; const newState = !isAudioEnabled; localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = newState; }); setIsAudioEnabled(newState); }, [isAudioEnabled]);
    const toggleVideo = useCallback(() => { if (!isMountedRef.current || !localStreamRef.current) return; const newState = !isVideoEnabled; localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = newState; }); setIsVideoEnabled(newState); }, [isVideoEnabled]);
    const leaveRoom = useCallback(() => { console.log("[Leave Room] Initiated."); cleanup(); }, [cleanup]);

  // --- Return Values ---
  return { localStream, peers, isConnectedToPeerJS, isSignalingConnected, error, isAudioEnabled, isVideoEnabled, messages, toggleAudio, toggleVideo, sendChatMessage, leaveRoom };
};