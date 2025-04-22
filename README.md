
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
