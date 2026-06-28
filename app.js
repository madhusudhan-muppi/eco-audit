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

        const fileInput = document.getElementById('proof');
        let imageBase64 = null;

        // Process image if provided
        if (fileInput && fileInput.files.length > 0) {
            submitBtn.innerHTML = 'Processing Image... <span class="spinner">🖼️</span>';
            try {
                imageBase64 = await processImage(fileInput.files[0]);
            } catch (err) {
                console.error("Error processing image", err);
                showStatus('Error processing image. Trying without it.', 'error');
            }
        }

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
                            timestamp: serverTimestamp(),
                            image: imageBase64 // Optional base64 string
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

    // Image compression utility
    function processImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600;
                    const MAX_HEIGHT = 600;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to 0.7 quality JPEG
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
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

            let imageHtml = '';
            if (data.image) {
                imageHtml = `<img src="${data.image}" alt="Proof of Disposal" class="item-image" loading="lazy">`;
            }

            item.innerHTML = `
                <div class="item-header">
                    <span class="badge ${badgeClass}">${data.category}</span>
                    <span class="item-date">${date}</span>
                </div>
                <div class="item-weight">${data.weight.toFixed(2)} <span>kg</span></div>
                <div class="item-location">
                    <span>📍</span> ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}
                </div>
                ${imageHtml}
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
