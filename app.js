import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDp_KuQmjefPsK5HYiU09YJgYRY9GsoRNE",
    authDomain: "ecoaudit-da2be.firebaseapp.com",
    projectId: "ecoaudit-da2be",
    storageBucket: "ecoaudit-da2be.firebasestorage.app",
    messagingSenderId: "776687262786",
    appId: "1:776687262786:web:62f09ac87e6101255661db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Form Submission Logic (index.html) ---
const logForm = document.getElementById('log-form');
if (logForm) {
    const submitBtn = document.getElementById('submit-btn');
    const statusMsg = document.getElementById('status-msg');

    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const category = document.getElementById('category').value;
        const weight = parseFloat(document.getElementById('weight').value);
        
        if (!category || isNaN(weight) || weight <= 0) {
            showStatus('Please enter valid data.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Getting Location... <span class="spinner">⏳</span>';

        // Phase 2: Geolocation API
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    submitBtn.innerHTML = 'Saving to Firebase... <span class="spinner">☁️</span>';

                    try {
                        // Push to Firestore
                        await addDoc(collection(db, "waste_logs"), {
                            category: category,
                            weight: weight,
                            latitude: lat,
                            longitude: lng,
                            timestamp: serverTimestamp()
                        });
                        
                        showStatus('Log successfully submitted!', 'success');
                        logForm.reset();
                    } catch (error) {
                        console.error("Error adding document: ", error);
                        showStatus('Error saving data to database.', 'error');
                    } finally {
                        resetButton();
                    }
                },
                (error) => {
                    // Phase 5: Error Handling
                    console.error("Geolocation Error: ", error);
                    showStatus('Location access is required to log waste. Please allow location access.', 'error');
                    resetButton();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            showStatus('Geolocation is not supported by your browser.', 'error');
            resetButton();
        }
    });

    function showStatus(msg, type) {
        statusMsg.textContent = msg;
        statusMsg.className = `status-message status-${type}`;
    }

    function resetButton() {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Log Waste <span>🌿</span>';
    }
}

// --- Dashboard Logic (dashboard.html) ---
const feedContainer = document.getElementById('feed-container');
const totalEwasteEl = document.getElementById('total-ewaste');
let map;
let markers = [];

if (feedContainer) {
    // Phase 5 Bonus: Initialize Leaflet Map if container exists
    const mapEl = document.getElementById('map');
    if (mapEl && window.L) {
        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);
    }

    // Phase 3: Fetch logs and calculate totaling
    const logsQuery = query(collection(db, "waste_logs"), orderBy("timestamp", "desc"));
    
    // Using onSnapshot for live updates
    onSnapshot(logsQuery, (snapshot) => {
        feedContainer.innerHTML = ''; // Clear loading
        let totalEwaste = 0;
        
        // Clear old map markers
        if (map) {
            markers.forEach(m => map.removeLayer(m));
            markers = [];
        }

        if (snapshot.empty) {
            feedContainer.innerHTML = '<div class="loading">No waste logs found yet. Start logging!</div>';
            return;
        }

        const bounds = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Phase 3: Live Totaling
            if (data.category === 'E-Waste') {
                totalEwaste += data.weight;
            }

            // Render Feed Item
            const item = document.createElement('div');
            item.className = 'feed-item';
            
            const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Just now';
            const badgeClass = data.category.toLowerCase().replace(' ', '-');

            item.innerHTML = `
                <div class="item-header">
                    <span class="badge ${badgeClass}">${data.category}</span>
                    <span class="item-date">${date}</span>
                </div>
                <div class="item-weight">${data.weight.toFixed(2)} <span>kg</span></div>
                <div class="item-location">
                    <span>📍</span> ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}
                </div>
            `;
            feedContainer.appendChild(item);

            // Phase 5: Add marker to map
            if (map && data.latitude && data.longitude) {
                const marker = L.marker([data.latitude, data.longitude]).addTo(map);
                marker.bindPopup(`<b>${data.category}</b><br>${data.weight} kg`);
                markers.push(marker);
                bounds.push([data.latitude, data.longitude]);
            }
        });

        // Update total
        if (totalEwasteEl) {
            totalEwasteEl.textContent = totalEwaste.toFixed(2);
        }

        // Fit map to markers
        if (map && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    });
}
