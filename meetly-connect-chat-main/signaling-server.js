// signaling-server.js
import { WebSocketServer, WebSocket } from 'ws';
import https from 'https'; // Use Node's https module
import fs from 'fs';     // Use Node's file system module
import path from 'path';   // Use Node's path module
import { fileURLToPath } from 'url'; // Helper for __dirname in ES modules

const PORT = 3001; // Port for the signaling server

// --- Helper to get __dirname in ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- End Helper ---


// --- Certificate Loading ---
// Assumes cert.pem and key.pem are in the same directory as this script (project root)
const certPath = path.resolve(__dirname, 'cert.pem');
const keyPath = path.resolve(__dirname, 'key.pem');

let httpsOptions;
try {
    httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
    console.log(`[Signaling Server] SSL certificates loaded successfully from:`);
    console.log(`  Key: ${keyPath}`);
    console.log(`  Cert: ${certPath}`);
} catch (err) {
    console.error("---------------------------------------------------------");
    console.error("!!! FAILED TO LOAD SSL CERTIFICATES !!!");
    // @ts-ignore
    console.error(`Error loading certs:`, err.message);
    console.error(`Please ensure 'key.pem' and 'cert.pem' exist in the project root.`);
    console.error(`Generate them using mkcert: mkcert localhost 127.0.0.1 ::1 <your-local-ip>`);
    console.error(`Example: mkcert localhost 127.0.0.1 ::1 192.168.1.10`);
    console.error("---------------------------------------------------------");
    process.exit(1); // Exit if certs can't be loaded
}


// --- Create HTTPS Server ---
const server = https.createServer(httpsOptions, (req, res) => {
    // Basic response for non-WebSocket HTTPs requests (e.g., health check)
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Secure Signaling Server is active.\n');
});

// --- Create WebSocket Server and Attach to HTTPS Server ---
const wss = new WebSocketServer({ server }); // Attach WSS to the HTTPS server instance
console.log(`[Signaling Server] WebSocketServer created and attached to HTTPS server.`);

// --- Signaling Logic ---
const rooms = new Map(); // Map<roomId, Set<WebSocket>>
const clients = new Map(); // Map<WebSocket, { peerId: string | null, roomId: string | null }>

wss.on('connection', (ws) => {
    console.log('[Signaling] Client connected');
    clients.set(ws, { peerId: null, roomId: null });

    ws.on('message', (message) => {
        let data;
        try {
            // @ts-ignore
            data = JSON.parse(message.toString());
        } catch (e) {
            console.error('[Signaling] Invalid JSON:', message.toString(), e); return;
        }

        const clientInfo = clients.get(ws);
        if (!clientInfo) { ws.close(); return; }

        if (data.type === 'join-room') {
            const { roomId, peerId } = data.payload;
            if (!roomId || !peerId) { console.error("Invalid join payload"); return; }

            const oldRoomId = clientInfo.roomId;
            clientInfo.roomId = roomId;
            clientInfo.peerId = peerId;

            // Leave old room
            if (oldRoomId && oldRoomId !== roomId) {
                const oldRoom = rooms.get(oldRoomId);
                if (oldRoom?.delete(ws)) {
                    if (oldRoom.size === 0) rooms.delete(oldRoomId);
                    else broadcast(oldRoomId, ws, JSON.stringify({ type: 'peer-left', payload: { peerId } }));
                }
            }
            // Join new room
            if (!rooms.has(roomId)) rooms.set(roomId, new Set());
            const room = rooms.get(roomId);
            if (!room.has(ws)) {
                room.add(ws);
                console.log(`[Signaling] Peer ${peerId} joined ${roomId}. Size: ${room.size}`);
                broadcast(roomId, ws, JSON.stringify({ type: 'peer-joined', payload: { peerId } }));
            }
            // Send peer list
            const others = Array.from(room)
                // @ts-ignore
                .map(c => clients.get(c)?.peerId)
                .filter((id) => id !== null && id !== peerId);
            // @ts-ignore
            ws.send(JSON.stringify({ type: 'room-peers', payload: { peers: others } }));

        } else { console.log('[Signaling] Unknown msg type:', data.type); }
    });

    ws.on('close', (code, reason) => {
        // @ts-ignore
        const reasonStr = reason.toString(); console.log(`[Signaling] Client disconnected. Code: ${code}, Reason: ${reasonStr}`);
        const clientInfo = clients.get(ws);
        if (clientInfo?.roomId && clientInfo.peerId) {
            const { roomId, peerId } = clientInfo; const room = rooms.get(roomId);
            if (room?.delete(ws)) {
                if (room.size === 0) rooms.delete(roomId);
                else broadcast(roomId, ws, JSON.stringify({ type: 'peer-left', payload: { peerId } }));
            }
        }
        clients.delete(ws); console.log(`[Signaling] Active clients: ${clients.size}, Rooms: ${rooms.size}`);
    });

    ws.on('error', (error) => { console.error('[Signaling] WS error:', error); ws.close(); });
});

wss.on('error', (error) => { console.error('[Signaling] WSS instance error:', error); });

function broadcast(roomId, senderWs, message) {
    const room = rooms.get(roomId); if (!room) return;
    room.forEach(clientWs => { if (clientWs !== senderWs && clientWs.readyState === WebSocket.OPEN) clientWs.send(message); });
}
// --- End Signaling Logic ---


// --- Start the HTTPS Server ---
server.listen(PORT, () => {
    console.log(`✅ Secure Signaling Server listening on wss://<your-local-ip>:${PORT}`);
    console.log(`   (Replace <your-local-ip> with your actual IP address, e.g., 192.168.73.240)`);
});