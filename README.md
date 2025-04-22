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

##✨ Features

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

---

## 💻 Technology Stack

Meetly leverages the following technologies:

| Category         | Technology / Library                                     | Purpose                                       |
| :--------------- | :------------------------------------------------------- | :-------------------------------------------- |
| **Frontend**     | React, Vite, TypeScript                                  | Building the user interface & application logic |
| **Styling**      | Tailwind CSS, shadcn/ui                                  | UI design and components                      |
| **Real-time**    | WebRTC                                                   | Peer-to-peer video/audio/data streaming     |
|                  | PeerJS                                                   | Simplifying WebRTC connection setup           |
| **Signaling**    | Node.js, WebSocket (`ws` library), HTTPS/WSS             | User discovery & connection coordination    |
| **Dev Security** | `mkcert`                                                 | Generating locally trusted SSL certificates   |

---

## 📁 Project Structure

This project follows a structured organization 
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

*Note: The structure above includes common directories found in larger full-stack apps (like `app`, `server`, `tests`, etc.). The current implementation mainly uses `src`, `public`, and the root configuration files, along with the separate `signaling-server.js`.*

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js:** LTS version (e.g., v18 or v20) recommended. Download from [nodejs.org](https://nodejs.org/).
*   **npm:** Usually comes bundled with Node.js.
*   **`mkcert`:** Tool for creating locally-trusted development certificates. Installation instructions below.
*   **Git:** For cloning the repository.

---

## ⚙️ Installation

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd meetly # Or your project directory name
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

---

## 🔧 Configuration (CRITICAL)

This application requires **secure connections (HTTPS/WSS)** to access camera/microphone via WebRTC, even during local development. We use `mkcert` to create locally trusted SSL certificates.

**Step 1: Install `mkcert` and Local CA**

1.  **Install `mkcert`:** Follow the official instructions for your OS:
    [**mkcert Installation Guide**](https://github.com/FiloSottile/mkcert#installation)
    *(Requires package managers like Chocolatey (Win), Homebrew (Mac), or manual steps for Linux).*
2.  **Install Local CA (One-time setup per machine):** Open your terminal (as Admin on Windows if needed) and run:
    ```bash
    mkcert -install
    ```
    *(You might need to enter your system password).*

**Step 2: Generate SSL Certificates for Your Network IP** 🔑

1.  **Find Your Local IP Address:** Determine the **IPv4 address** of the machine where you will run the signaling server (e.g., `192.168.X.Y`). Use `ipconfig` (Win) or `ip addr`/`ifconfig` (Mac/Linux).
2.  **Navigate to Project Root:** Open your terminal in the project directory.
3.  **Run `mkcert`:** Replace `YOUR_LOCAL_IP` with the actual IP address you found.
    ```bash
    # --- Replace YOUR_LOCAL_IP with your actual IP ---
    mkcert localhost 127.0.0.1 ::1 YOUR_LOCAL_IP
    ```
    *Example:* `mkcert localhost 127.0.0.1 ::1 192.168.73.240`
4.  **Rename Output Files:** `mkcert` will create two files (e.g., `localhost+3.pem` and `localhost+3-key.pem`). Rename them exactly:
    *   Rename the `.pem` file to `cert.pem`
    *   Rename the `-key.pem` file to `key.pem`
5.  **Verify:** Ensure `cert.pem` and `key.pem` are now in your project root.
6.  **Git Ignore:** Add `*.pem` to your `.gitignore` file to avoid committing these private keys.

**Step 3: Update IP Address in Code** 💻

1.  Open the file: `src/services/webrtc.ts`
2.  Find the line:
    ```typescript
    const YOUR_SIGNALING_SERVER_IP = 'YOUR_COMPUTER_IP_ADDRESS'; // <--- *** CHANGE THIS LINE ***
    ```
3.  **Replace `'YOUR_COMPUTER_IP_ADDRESS'`** with the **same local IP address** you used in the `mkcert` command (Step 2.3). Make sure it's enclosed in quotes.
    *Example:* `const YOUR_SIGNALING_SERVER_IP = '192.168.73.240';`
4.  Save the file.

---

## ▶️ Running the Application

You need to run **two separate processes** in two different terminal windows:

1.  **Terminal 1: Start the Signaling Server** ⚙️
    *   Navigate to the project root directory.
    *   Run:
        ```bash
        npm run signal
        ```
        *(This executes `node signaling-server.js` as defined in `package.json`)*
    *   Keep this terminal open. You should see logs indicating the secure signaling server is listening on port 3001.

2.  **Terminal 2: Start the Vite Development Server (React App)** ✨
    *   Navigate to the project root directory.
    *   Run:
        ```bash
        npm run dev
        ```
    *   Vite will compile the app and provide URLs. Note the **`Network:` URL** (e.g., `https://192.168.X.Y:8080/`).
    *   Keep this terminal open.

---

## 🚀 Usage / Testing (Multi-Device on Same WiFi)

1.  **Device 1 (Creator):**
    *   Open a browser and navigate to the **Network HTTPS URL** from Vite (e.g., `https://<your-ip>:8080/`).
    *   **Accept Security Warning:** Click "Advanced" -> "Proceed..." (for port 8080).
    *   **Check Console (Optional):** Open the browser console (F12). If you see errors about connecting to `wss://<your-ip>:3001`, you might need to manually visit `https://<your-ip>:3001` once and accept *its* security warning too, then refresh the app page.
    *   Enter a name.
    *   Create a new room.
    *   Allow camera/microphone permissions.
    *   Note the **Room Code**.
    *   Check the Signaling Server terminal (Terminal 1) for connection logs.

2.  **Device 2 (Joiner - On Same WiFi):**
    *   Open a browser and navigate to the **same Network HTTPS URL** (e.g., `https://<your-ip>:8080/`).
    *   Accept security warning(s) for ports 8080 and potentially 3001.
    *   Enter a *different* name.
    *   Enter the **Room Code** from Device 1.
    *   Click "Join Room".
    *   Allow camera/microphone permissions.

3.  **Verify:**
    *   Wait a few seconds for connections to establish.
    *   Both devices should see each other's video/audio.
    *   Test mute/video controls and the chat feature.
    *   Check both terminal and browser consoles for connection status and any errors.

---

## 🙏 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

*(Add more specific contribution guidelines if applicable)*

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details (if you have one).

---
