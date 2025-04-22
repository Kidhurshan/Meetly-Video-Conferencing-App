# Meetly - Real-Time Video Conferencing Application

<!-- Optional: Insert a banner image/logo for Meetly here -->
<!-- ![Meetly Banner](path/to/your/banner_image.png) -->

Meetly is a web-based video conferencing application designed for real-time communication and collaboration. Built with modern web technologies, it allows users to create secure video rooms, join existing rooms using a simple code, and interact via video, audio, and text chat.

<!-- Insert Screenshot of Meetly Home Screen here -->
<!-- ![Meetly Home Screen](./path/to/home_screen_screenshot.png) -->
*Meetly Home Screen - Create or Join a Room*

<!-- Insert Screenshot of Meetly Meeting Room here -->
<!-- ![Meetly Meeting Room](./path/to/meeting_room_screenshot.png) -->
*Meetly Meeting Room - Grid View Example*

## Features

Meetly offers the following core features:

*   **Room Creation:** Easily generate a unique, secure room for your meeting.
*   **Room Joining:** Join existing meetings using a simple 6-character room code.
*   **Real-Time Video/Audio:** High-quality, peer-to-peer video and audio streaming powered by WebRTC.
*   **Text Chat:** Integrated chat panel for text communication within the meeting room.
*   **Mute/Unmute Audio:** Control your microphone input.
*   **Enable/Disable Video:** Control your camera input.
*   **Participant Count:** See the number of participants currently in the room.
*   **Room Code Sharing:** Easily copy the room code to invite others.
*   **Multiple Layouts:** Switch between a grid view (showing all participants equally) and a focus view (highlighting one speaker with thumbnails for others).
*   **Secure Connections:** Uses HTTPS for the application and WSS (Secure WebSockets) for signaling, ensuring secure communication channels (requires local setup using `mkcert` for development).

## Technology Stack

Meetly is built using a modern web stack:

| Category          | Technology/Library                                      | Purpose                                                      |
| :---------------- | :------------------------------------------------------ | :----------------------------------------------------------- |
| **Frontend**      | [React](https://reactjs.org/)                           | Building the user interface                                  |
|                   | [Vite](https://vitejs.dev/)                             | Fast development server and build tool                       |
|                   | [TypeScript](https://www.typescriptlang.org/)           | Superset of JavaScript adding static typing                  |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/)                     | Re-usable UI components (Buttons, Dialogs, etc.)             |
|                   | [Tailwind CSS](https://tailwindcss.com/)                | Utility-first CSS framework for styling                      |
| **Real-Time**     | [WebRTC](https://webrtc.org/)                           | Peer-to-peer video, audio, and data communication            |
|                   | [PeerJS](https://peerjs.com/)                           | Library simplifying WebRTC peer connections and broker usage  |
| **Signaling**     | [Node.js](https://nodejs.org/)                          | Backend runtime environment for the signaling server         |
|                   | [ws (WebSocket library)](https://github.com/websockets/ws) | Enables real-time, two-way communication for signaling       |
|                   | [mkcert](https://github.com/FiloSottile/mkcert)         | Tool for creating locally trusted SSL certificates (Dev Only) |

## Project Structure

```
meetly/
├── public/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.png
│   │   │   └── icons/
│   │   └── styles/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── meetings/
│   │   │   └── users/
│   │   ├── meetings/
│   │   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── common/
│   │   ├── meetings/
│   │   └── ui/
│   ├── config/
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useWebRTC.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── meeting.service.ts
│   ├── store/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── socket/
├── tests/
│   ├── e2e/
│   └── unit/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Installation and Setup (Development)

Follow these steps to set up and run Meetly locally for development and testing.

**Prerequisites:**

*   [Node.js](https://nodejs.org/) (LTS version recommended, e.g., v18 or v20)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   `mkcert` installed (for generating local SSL certificates)

**Steps:**

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd meetly-project # Or your project directory name
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Setup `mkcert` (One-Time Setup per Machine):**
    *   Install `mkcert` if you haven't already (see [mkcert installation instructions](https://github.com/FiloSottile/mkcert#installation)).
    *   Install the local Certificate Authority (CA):
        ```bash
        mkcert -install
        ```
        (You might need administrator/sudo privileges).

4.  **Generate Local SSL Certificates:**
    *   **Find your local IP address:** Use `ipconfig` (Windows) or `ifconfig`/`ip addr` (macOS/Linux) to find the IP address of your machine on your current network (e.g., `192.168.1.123`).
    *   **Navigate to the project root directory** in your terminal.
    *   **Run `mkcert`:** Replace `<your-local-ip>` with your actual IP.
        ```bash
        # Example: Replace 192.168.1.123 with YOUR IP
        mkcert localhost 127.0.0.1 ::1 <your-local-ip>
        ```
    *   **Rename the generated files:** Rename the created `.pem` file to `cert.pem` and the `-key.pem` file to `key.pem`. These should now be in your project root.
    *   **Ensure `.gitignore`:** Make sure `*.pem` is listed in your `.gitignore` file.

5.  **Configure Signaling Server IP:**
    *   Open the file `src/services/webrtc.ts`.
    *   Find the line: `const YOUR_SIGNALING_SERVER_IP = 'YOUR_COMPUTER_IP_ADDRESS';`
    *   **Replace `'YOUR_COMPUTER_IP_ADDRESS'`** with the **same local IP address** you used in the `mkcert` command above. Save the file.

6.  **Run the Servers:** You need to run two separate processes:
    *   **Terminal 1 (Signaling Server):**
        ```bash
        npm run signal
        # Or: node signaling-server.js
        ```
        Keep this running. It should log that the secure signaling server is listening on port 3001.
    *   **Terminal 2 (Vite Dev Server):**
        ```bash
        npm run dev
        ```
        Keep this running. Note the `Network:` URL (e.g., `https://<your-local-ip>:8080/`).

## Usage

1.  **Access the App:** Open your web browser and navigate to the **`Network:` URL** provided by Vite (e.g., `https://<your-local-ip>:8080/`).
2.  **Accept Security Warning:** Since you're using self-signed certificates, your browser will show a security warning. Click "Advanced" and "Proceed to `<your-ip>` (unsafe)". You might need to do this for *both* port 8080 (Vite) and port 3001 (Signaling Server - try visiting `https://<your-ip>:3001` directly if the WebSocket connection fails initially).
3.  **User 1 (Create Room):**
    *   Enter your name.
    *   Click "Create a new room instead".
    *   Click "Create New Room".
    *   Allow camera/microphone permissions if prompted.
    *   Note the 6-character **Room Code** displayed.
4.  **User 2 (Join Room - on a different device on the *same* WiFi network):**
    *   Access the same **`Network:` URL** (e.g., `https://<your-local-ip>:8080/`) in their browser.
    *   Accept any security warnings.
    *   Enter their name.
    *   Enter the **Room Code** provided by User 1.
    *   Click "Join Room".
    *   Allow camera/microphone permissions.
5.  **Connect:** After a few seconds, the WebRTC connection should establish, and both users should see each other's video feeds.
6.  **Interact:** Use the controls to mute/unmute audio, enable/disable video, and use the chat panel.
7.  **Leave:** Click the "Leave Room" button to disconnect and return to the home screen.

## Contributing

(Optional: Add guidelines if you want others to contribute)
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.

## License

(Optional: Specify your license, e.g., MIT)
[MIT](https://choosealicense.com/licenses/mit/)
