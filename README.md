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
- **Live Feed**: A real-time dashboard showing global waste logs using Firestore `onSnapshot`.
- **E-Waste Metric**: Calculates and displays the total E-Waste logged in real-time.
- **Global Map**: Plots waste logs on an interactive map.

## How to Run Locally

1. Clone the repository to your local machine.
2. Open the project folder in VS Code or your preferred editor.
3. Use a local server to run the project. For example, if you use VS Code, install the **Live Server** extension.
4. Right-click on `index.html` and select **"Open with Live Server"**.
5. The application will open in your browser at `http://127.0.0.1:5500`.

*Note: The Geolocation API requires a secure context. It will work on `localhost` or `127.0.0.1`, but not on plain `http://` over a network.*

## GitHub Push Instructions

Since you asked how to create and push to a remote repository on GitHub, here are the steps:

1. **Create a GitHub Repo**: Go to [GitHub.com](https://github.com/new), log in, and create a new repository called `eco-audit`. Do **not** initialize it with a README, .gitignore, or license (keep it completely empty).
2. **Commit your code locally** (run these in your terminal in this project folder):
   ```bash
   git add .
   git commit -m "Initial commit: EcoAudit phases 1-5"
   ```
3. **Link to GitHub & Push**: (Replace `YOUR_USERNAME` with your GitHub username)
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/eco-audit.git
   git branch -M main
   git push -u origin main
   ```

## Netlify Deployment

Since you chose to deploy to Netlify, follow these steps:
1. Push your code to GitHub using the instructions above.
2. Go to [Netlify](https://app.netlify.com/).
3. Click **"Add new site"** -> **"Import an existing project"**.
4. Choose **GitHub** and authorize if prompted.
5. Select the `eco-audit` repository.
6. The build settings can be left blank (Publish directory will default to the root folder).
7. Click **"Deploy Site"**. 
8. Netlify will generate a live secure `https://` link (e.g., `https://something-random.netlify.app`). 
9. **Test the App**: Open that link on your mobile phone, log waste, accept the location permission, and watch the dashboard update!
