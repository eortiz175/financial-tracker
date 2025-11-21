# financial-tracker
Personal financial tracking application with Google Sheets integration

# Financial Tracker

A personal financial tracking application that syncs with Google Sheets for data persistence.

## Features

- ✅ Password-protected access
- ✅ Google Sheets integration for data persistence
- ✅ Automatic transaction categorization
- ✅ Budget tracking and alerts
- ✅ Mobile-responsive design

## Setup Instructions

### 1. Google Sheets Setup
1. Create a Google Sheet with four tabs: `transactions`, `budget_config`, `categories`, `goals`
2. Follow the column structure outlined in the documentation

### 2. Google Cloud Setup
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sheets API
3. Create service account credentials
4. Share your Google Sheet with the service account email

### 3. Configuration
1. Copy `config.example.js` to `config.js`
2. Fill in your credentials from Google Cloud Console
3. Update the spreadsheet ID

### 4. Deployment
This app is designed to work with GitHub Pages. Simply enable GitHub Pages in your repository settings.

## Security Notes

- All sensitive data is stored in Google Sheets, not in the repository
- Password protection prevents unauthorized access
- No financial data is stored in the repository

## Development

To run locally:
1. Clone this repository
2. Serve the files using a local server (e.g., `python -m http.server 8000`)
3. Open `http://localhost:8000` in your browser
