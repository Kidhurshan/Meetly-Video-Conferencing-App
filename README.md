# Meetly - Video Conferencing Solution

<div align="center">
<img width="1908" height="881" alt="image" src="https://github.com/user-attachments/assets/ceed4c33-f03b-491a-aee9-7fb680967b80" />

[![Next.js](https://img.shields.io/badge/Next.js-13.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

A modern, scalable video conferencing platform built for enterprise-grade communication.

[Features](#features) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Demo](#demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Architecture](#architecture)
- [🔧 Configuration (CRITICAL)](#-configuration-critical)
- [▶️ Running the Application](#️-running-the-application)
- [🚀 Usage / Testing (Multi-Device on Same WiFi)](#-usage--testing-multi-device-on-same-wifi)
- [Contributing](#contributing)
- [License](#license)

## Overview

Meetly is an enterprise-grade video conferencing solution that enables seamless real-time communication across different platforms. Built with modern technologies and best practices, it provides high-quality video calls, instant messaging, and collaborative features for both personal and professional use.

### 💡Key Benefits

- **Enterprise-Ready**: Built with scalability and security in mind
- **Cross-Platform**: Works seamlessly across desktop and mobile devices
- **High Performance**: Optimized for low latency and high-quality video
- **Secure**: End-to-end encryption and enterprise-grade security
- **Customizable**: Flexible architecture for custom integrations

## 🎥Demo

<h2 align="center">🎥 Project Demo</h2>
Watch a live demonstration of Meetly on YouTube:
<p align="center">
  <a href="https://youtu.be/LlQo6g2Lkfg">
    <img src="https://github.com/user-attachments/assets/4f52f822-248b-4b85-ad83-62f251765dc3" alt="Project Demo Video" width="600" />
  </a>
</p>

---

## 📋Screenshots

### Home Page
<p align="center">
  <img width="1600" alt="image" src="https://github.com/user-attachments/assets/0bd1ed14-3133-4239-a5e1-88a27aa8e356" />
</p>

### Meeting Room
<p align="center">
  <img width="1600" alt="image" src="https://github.com/user-attachments/assets/ec367ec3-c9d8-47d7-be32-e4b95fcda763" />
</p>

### Chat Panel
<p align="center">
  <img width="1600" alt="image" src="https://github.com/user-attachments/assets/340f0f48-5b04-43ac-a513-d697c655cd08" />
</p>

## Features

### Core Functionality
- 🎥 **HD Video Conferencing**
  - Up to 1080p video quality
  - Adaptive bitrate streaming
  - Background blur and virtual backgrounds
  - Multiple layout options

- 💬 **Real-time Communication**
  - Instant messaging during calls
  - File sharing
  - Screen sharing
  - Whiteboard collaboration

- 👥 **Meeting Management**
  - Meeting scheduling
  - Calendar integration
  - Meeting recordings
  - Breakout rooms

### Advanced Features
- 🔐 **Security**
  - End-to-end encryption
  - Two-factor authentication
  - Role-based access control
  - Compliance with GDPR and HIPAA

- 🎨 **User Experience**
  - Modern, intuitive interface
  - Dark/Light mode
  - Keyboard shortcuts
  - Accessibility features

## Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 13+ with App Router
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **State Management**: Redux Toolkit
- **Real-time Communication**: WebRTC, Socket.io-client
- **Type Safety**: TypeScript

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Real-time**: Socket.io
- **Authentication**: JWT, OAuth2
- **API Documentation**: Swagger/OpenAPI

### System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client Layer  │     │  Application    │     │   Data Layer    │
│                 │     │     Layer       │     │                 │
│  - Next.js App  │◄───►│  - Express API  │◄───►│   - MongoDB     │
│  - WebRTC       │     │  - Socket.io    │     │   - Redis Cache │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

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

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with ❤️ by the Meetly Team

[Documentation](docs/README.md) • [Support](mailto:support@meetly.com) • [Website](https://meetly.com)
</div>
