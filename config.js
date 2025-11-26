// config.js - UPDATE THESE VALUES WITH YOUR ACTUAL CREDENTIALS

// Remove this entire config.js file from GitHub by adding it to .gitignore
// For GitHub Pages deployment, we'll use a different approach

const CONFIG = {
    // Get this from your Google Sheet URL
    SPREADSHEET_ID: '1oZj6pqvsK0vH72IpRM9Y8ZFtgH7D6To_IsKmCbfxitQ',
    
    // Get these from Google Cloud Console
    API_KEY: '555bfa545d92f9ab29ce1683ee2d5f43af3dea51',
    CLIENT_ID: 'financial-tracker-service@financial-tracker-mannie.iam.gserviceaccount.com',
    
    // App version
    VERSION: '1.0.0',
    
    // Default categories (fallback if sheet not available)
    DEFAULT_CATEGORIES: [
        'groceries', 'transport', 'flex', 'bills', 'amex', 
        'nelnet', 'klarna', 'sister', 'fitness', 'income'
    ],
    
    // Password for auth (change this!)
    APP_PASSWORD: 'YourSecurePassword123'
};

// For GitHub Pages, we'll need to handle credentials differently
// This approach stores them in browser localStorage after first setup
function initializeConfig() {
    if (!localStorage.getItem('financial_config')) {
        // First time setup - prompt for credentials
        const spreadsheetId = prompt('Please enter your Google Sheet ID:');
        const apiKey = prompt('Please enter your Google API Key:');
        
        if (spreadsheetId && apiKey) {
            localStorage.setItem('financial_config', JSON.stringify({
                SPREADSHEET_ID: spreadsheetId,
                API_KEY: apiKey,
                configured: true
            }));
            alert('Configuration saved! The page will now reload.');
            window.location.reload();
        }
    }
}

// Call this on auth.html load
// initializeConfig(); // We'll enable this later
