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
let globe = null;

if (feedContainer) {
    // Phase 5 Bonus: Initialize 3D Globe if container exists
    const mapEl = document.getElementById('map');
    if (mapEl && window.Globe) {
        globe = Globe()
            (mapEl)
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundColor('rgba(0,0,0,0)')
            .width(mapEl.offsetWidth)
            .height(400)
            .pointAltitude(0.05)
            .pointColor(d => {
                if (d.category === 'E-Waste') return '#ef4444';
                if (d.category === 'Organic') return '#22c55e';
                return '#38bdf8'; // Plastic
            })
            .pointRadius(d => Math.min(d.weight * 0.1, 1)) // Scale radius slightly by weight
            .pointsTransitionDuration(1500)
            .pointLabel(d => `
                <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; color: white;">
                    <b>${d.category}</b><br/>${d.weight.toFixed(2)} kg
                </div>
            `);
            
        // Setup initial rotation
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.5;

        // Handle resize
        window.addEventListener('resize', () => {
            if (mapEl.offsetWidth) {
                globe.width(mapEl.offsetWidth);
            }
        });
    }

    // Phase 3: Fetch logs and calculate totaling
    const logsQuery = query(collection(db, "waste_logs"), orderBy("timestamp", "desc"));
    
    // Using onSnapshot for live updates
    onSnapshot(logsQuery, (snapshot) => {
        feedContainer.innerHTML = ''; // Clear loading
        let totalEwaste = 0;
        const globeData = [];

        if (snapshot.empty) {
            feedContainer.innerHTML = '<div class="loading">No waste logs found yet. Start logging!</div>';
            return;
        }

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

            // Collect data for Globe
            if (globe && data.latitude && data.longitude) {
                globeData.push({
                    lat: data.latitude,
                    lng: data.longitude,
                    category: data.category,
                    weight: data.weight
                });
            }
        });

        // Update total
        if (totalEwasteEl) {
            totalEwasteEl.textContent = totalEwaste.toFixed(2);
        }

        // Update Globe Points
        if (globe && globeData.length > 0) {
            globe.pointsData(globeData);
        }
    });
}
