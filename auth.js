// Import Firebase modules - we'll add more as we need them
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// --- Main async function to initialize Firebase and set up listeners ---
async function initializeAuth() {
    // 1. Fetch Firebase config from our Netlify function
    let firebaseConfig;
    try {
        const response = await fetch('/.netlify/functions/get-firebase-config');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        firebaseConfig = await response.json();

        // Check if the config keys are present
        if (!firebaseConfig.apiKey) {
            console.error("Firebase config is missing. Make sure Netlify environment variables are set.");
            document.getElementById('errorMessage').textContent = "Configuration error. Please contact support.";
            return; // Stop execution if config is not loaded
        }

    } catch (error) {
        console.error("Failed to fetch Firebase config:", error);
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = "Could not connect to services. Please try again later.";
        }
        return; // Stop execution
    }

    // 2. Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    // --- DOM Element Selectors ---
    const signInTab = document.getElementById('signInTab');
    const signUpTab = document.getElementById('signUpTab');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const errorMessageElement = document.getElementById('errorMessage');

    // --- Tab Switching Logic (Only on auth.html) ---
    if (signInTab) {
        signInTab.addEventListener('click', () => {
            signInTab.classList.add('active');
            signUpTab.classList.remove('active');
            signInForm.style.display = 'block';
            signUpForm.style.display = 'none';
            errorMessageElement.textContent = ''; // Clear errors
        });
    }
    if(signUpTab) {
        signUpTab.addEventListener('click', () => {
            signUpTab.classList.add('active');
            signInTab.classList.remove('active');
            signUpForm.style.display = 'block';
            signInForm.style.display = 'none';
            errorMessageElement.textContent = ''; // Clear errors
        });
    }

    // --- Sign-Up Logic ---
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signUpEmail').value;
            const password = document.getElementById('signUpPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            errorMessageElement.textContent = '';

            if (password !== confirmPassword) {
                errorMessageElement.textContent = "Passwords do not match.";
                return;
            }

            try {
                await createUserWithEmailAndPassword(auth, email, password);
                // The onAuthStateChanged observer will handle the redirect
            } catch (error) {
                errorMessageElement.textContent = error.message;
            }
        });
    }

    // --- Sign-In Logic ---
    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signInEmail').value;
            const password = document.getElementById('signInPassword').value;
            errorMessageElement.textContent = '';

            try {
                await signInWithEmailAndPassword(auth, email, password);
                // The onAuthStateChanged observer will handle the redirect
            } catch (error) {
                errorMessageElement.textContent = error.message;
            }
        });
    }

    // --- Google Sign-In Logic ---
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            errorMessageElement.textContent = '';
            try {
                await signInWithPopup(auth, googleProvider);
                 // The onAuthStateChanged observer will handle the redirect
            } catch (error) {
                errorMessageElement.textContent = error.message;
            }
        });
    }

    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                // The onAuthStateChanged observer will handle the redirect to index.html
                window.location.href = 'index.html';
            } catch (error) {
                console.error("Logout failed:", error);
            }
        });
    }

    // --- Auth State Observer ---
    onAuthStateChanged(auth, (user) => {
        const currentPage = window.location.pathname;

        if (user) {
            // User is signed in
            if (currentPage.includes('auth.html')) {
                window.location.href = 'explore.html';
            }
        } else {
            // User is signed out
            if (currentPage.includes('explore.html')) {
                window.location.href = 'auth.html';
            }
        }
    });

}

// --- Run the initialization ---
initializeAuth();
