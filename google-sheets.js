// google-sheets.js
class GoogleSheetsManager {
    constructor() {
        this.SPREADSHEET_ID = this.getConfig('SPREADSHEET_ID');
        this.API_KEY = this.getConfig('API_KEY');
        this.initialized = false;
        this.connected = false;
    }

    // Get configuration from localStorage or CONFIG
    getConfig(key) {
        const storedConfig = localStorage.getItem('financial_config');
        if (storedConfig) {
            const config = JSON.parse(storedConfig);
            return config[key] || CONFIG[key];
        }
        return CONFIG[key];
    }

    async initClient() {
        return new Promise((resolve, reject) => {
            if (!this.SPREADSHEET_ID || !this.API_KEY) {
                reject(new Error('Google Sheets configuration missing. Please check your settings.'));
                return;
            }

            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.API_KEY,
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                    });
                    
                    this.initialized = true;
                    this.connected = true;
                    console.log('Google Sheets API initialized successfully');
                    resolve();
                } catch (error) {
                    console.error('Error initializing Google Sheets API:', error);
                    this.connected = false;
                    reject(error);
                }
            });
        });
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initClient();
        }
        return this.connected;
    }

    // Read data from a sheet
    async readSheet(sheetName, range = 'A:Z') {
        if (!await this.ensureInitialized()) {
            throw new Error('Google Sheets not initialized');
        }

        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${sheetName}!${range}`
            });
            
            return response.result.values || [];
        } catch (error) {
            console.error(`Error reading sheet ${sheetName}:`, error);
            throw error;
        }
    }

    // Append data to a sheet
    async appendToSheet(sheetName, values) {
        if (!await this.ensureInitialized()) {
            throw new Error('Google Sheets not initialized');
        }

        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });
            
            console.log('Data appended successfully to Google Sheets');
            return response;
        } catch (error) {
            console.error(`Error appending to sheet ${sheetName}:`, error);
            throw error;
        }
    }

    // Load all initial data
    async loadAllData() {
        try {
            const [transactionsData, budgetData, categoriesData, goalsData] = await Promise.all([
                this.readSheet('transactions').catch(() => []),
                this.readSheet('budget_config').catch(() => []),
                this.readSheet('categories').catch(() => []),
                this.readSheet('goals').catch(() => [])
            ]);
            
            return {
                transactions: this.parseSheetData(transactionsData),
                budgetConfig: this.parseSheetData(budgetData),
                categories: this.parseSheetData(categoriesData),
                goals: this.parseSheetData(goalsData)
            };
        } catch (error) {
            console.error('Error loading all data from Google Sheets:', error);
            throw error;
        }
    }

    // Convert sheet data to objects
    parseSheetData(sheetData) {
        if (!sheetData || sheetData.length === 0) return [];
        
        const headers = sheetData[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
        return sheetData.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
    }

    // Add a new transaction
    async addTransaction(transaction) {
        const values = [
            [
                transaction.id || this.generateId(),
                transaction.date || new Date().toISOString().split('T')[0],
                transaction.amount,
                transaction.description,
                transaction.category,
                transaction.type || 'payment',
                new Date().toISOString()
            ]
        ];
        
        return await this.appendToSheet('transactions', values);
    }

    // Add income
    async addIncome(income) {
        const values = [
            [
                income.id || this.generateId(),
                income.date || new Date().toISOString().split('T')[0],
                income.amount,
                income.source,
                'income',
                'income',
                new Date().toISOString()
            ]
        ];
        
        return await this.appendToSheet('transactions', values);
    }

    // Test connection to Google Sheets
    async testConnection() {
        try {
            await this.ensureInitialized();
            const data = await this.readSheet('transactions', 'A1:A1');
            return {
                success: true,
                message: '✅ Successfully connected to Google Sheets'
            };
        } catch (error) {
            return {
                success: false,
                message: `❌ Connection failed: ${error.message}`
            };
        }
    }

    generateId() {
        return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Create global instance
const sheetsManager = new GoogleSheetsManager();
