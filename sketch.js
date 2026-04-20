import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- 1. CONFIG (REPLACE WITH YOUR KEYS) ---
const firebaseConfig = {
  apiKey: "AIzaSyC-Sw00mpikjko32i0FWaYCjbzxPYRFQdA",
  authDomain: "perfect-project-ima-af6b4.firebaseapp.com",
  projectId: "perfect-project-ima-af6b4",
  storageBucket: "perfect-project-ima-af6b4.firebasestorage.app",
  messagingSenderId: "114558267517",
  appId: "1:114558267517:web:d4977232fa1e8f6178c114",
  measurementId: "G-RXFTP5LY4Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- 2. APP STATE ---
let inventory = ['🛋️', '🛏️', '🍚', '💡', '🌳', '📺', '🎨'];
let placedItems = [];
let draggingItem = null;

// --- 3. BIND BUTTONS (Solve "No Response" Issue) ---
window.onload = () => {
    const loginBtn = document.getElementById('login-btn');
    const saveBtn = document.getElementById('save-btn');

    if (loginBtn) {
        loginBtn.onclick = () => signInWithPopup(auth, provider).catch(e => console.error(e));
    }

    if (saveBtn) {
        saveBtn.onclick = saveToFirebase;
    }
    
    // Load existing items once at start
    loadGallery();
};

// Listen for Login State
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('login-btn');
    const userDisplay = document.getElementById('user-display');
    if (user) {
        loginBtn.style.display = "none";
        userDisplay.innerText = "Architect: " + user.displayName;
    }
});

// --- 4. p5.js ENGINE ---
window.setup = function() {
    let canvas = createCanvas(600, 400);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER);
};

window.draw = function() {
    background(255);
    // Draw Border
    stroke(230); noFill(); rect(0,0,width,height);
    
    // Draw Furniture
    for (let item of placedItems) {
        textSize(40);
        text(item.char, item.x, item.y);
    }

    // Info Bar
    fill(240); noStroke(); rect(0, height-30, width, 30);
    fill(100); textSize(12);
    text("CLICK to spawn item. DRAG to arrange. LOGIN to save with your name.", width/2, height-15);
};

window.mousePressed = function() {
    // Selection for dragging
    for (let i = placedItems.length - 1; i >= 0; i--) {
        let d = dist(mouseX, mouseY, placedItems[i].x, placedItems[i].y);
        if (d < 30) { draggingItem = placedItems[i]; return; }
    }
    // Spawn new item if space is empty
    if (mouseY < height - 30 && mouseX > 0 && mouseX < width) {
        placedItems.push({ char: random(inventory), x: mouseX, y: mouseY });
    }
};

window.mouseDragged = function() {
    if (draggingItem) {
        draggingItem.x = mouseX;
        draggingItem.y = mouseY;
    }
};

window.mouseReleased = function() {
    draggingItem = null;
};

// --- 5. FIREBASE ACTIONS ---

async function saveToFirebase() {
    if (!auth.currentUser) return alert("You must Login with Google first!");
    if (placedItems.length === 0) return alert("Place some furniture first!");

    try {
        const desc = document.getElementById('description').value;
        await addDoc(collection(db, "rooms"), {
            creatorName: auth.currentUser.displayName,
            description: desc,
            furnitureCount: placedItems.length,
            createdAt: serverTimestamp()
        });
        alert("Saved to Community Gallery!");
        loadGallery(); // Refresh after saving
    } catch (e) {
        console.error("Error saving:", e);
    }
}

async function loadGallery() {
    const container = document.getElementById('gallery-container');
    container.innerHTML = "Fetching masterpieces...";

    try {
        const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        container.innerHTML = "";
        snap.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <h4>${data.creatorName}'s Design</h4>
                <p>"${data.description || 'Cool vibes only.'}"</p>
                <small>📦 ${data.furnitureCount} items placed</small>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error("Error loading gallery:", e);
    }
}