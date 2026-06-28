# EcoAudit

EcoAudit is a modern web application designed to help users log their waste contributions and track global waste metrics in real-time. It features a clean, responsive UI with glassmorphism aesthetics, live updating dashboards powered by Firebase Firestore, and geolocation-based logging.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla, custom properties, glassmorphism), JavaScript (ES6 Modules)
- **Backend/Database**: Firebase Firestore
- **Mapping**: Leaflet.js
- **APIs**: HTML5 Geolocation API

## Features

- **Log Waste**: Quickly log Plastic, E-Waste, or Organic waste with its weight.
- **Geolocation**: Automatically captures coordinates securely when logging waste.
- **Proof of Disposal**: Attach an image of the waste. Compresses locally and saves safely via Base64 encoding.
- **Live Feed**: A real-time dashboard showing global waste logs using Firestore `onSnapshot`.
- **E-Waste Metric**: Calculates and displays the total E-Waste logged in real-time.
- **Interactive 3D Globe**: Visualizes global waste logs dynamically on a stunning rotating 3D Earth using Three.js and Globe.gl.

## How to Run Locally

1. Clone the repository to your local machine.
2. Open the project folder in VS Code or your preferred editor.
3. Use a local server to run the project. For example, if you use VS Code, install the **Live Server** extension.
4. Right-click on `index.html` and select **"Open with Live Server"**.
5. The application will open in your browser at `http://127.0.0.1:5500`.

*Note: The Geolocation API requires a secure context. It will work on `localhost` or `127.0.0.1`, but not on plain `http://` over a network.*


