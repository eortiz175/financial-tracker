// script.js - Main Application Logic

// Global data storage
let financialData = {
    transactions: [],
    budgetConfig: {},
    categories: [],
    goals: [],
    currentBalance: 0,
    monthlySpending: 0,
    amexProgress: 0
};

// Initialize the application
async function initializeApp() {
    try {
        showLoading('Loading your financial data...');
        
        // Add logout button
        addLogoutButton();
        
        // Try to load from Google Sheets first
        try {
            const data = await sheetsManager.loadAllData();
            financialData.transactions = data.transactions;
            financialData.budgetConfig = parseBudgetConfig(data.budgetConfig);
            financialData.categories = data.categories;
            financialData.goals = data.goals;
            
            console.log('Data loaded from Google Sheets:', financialData);
        } catch (sheetsError) {
            console.warn('Google Sheets load failed, using local storage:', sheetsError);
            loadFromLocalStorage();
        }
        
        // Calculate derived data
        calculateFinancialMetrics();
        
        // Update UI
        updateDashboard();
        updateBudgetStatus();
        
        hideLoading();
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load data. Using local storage as fallback.');
        loadFromLocalStorage();
        hideLoading();
    }
}

// Parse budget config into usable format
function parseBudgetConfig(budgetData) {
    const config = {
        monthlyIncome: 4380,
        fixedCosts: {},
        discretionary: {}
    };
    
    if (!budgetData || budgetData.length === 0) {
        // Default fallback budget
        return {
            monthlyIncome: 4380,
            fixedCosts: {
                rent: 1270,
                capitalOne: 269,
                bills: 225,
                therapy: 150,
                lessons: 140,
                nelnet: 144.33,
                klarna: 19.79,
                sister: 72.26,
                fitness: 54.01
            },
            discretionary: {
                groceries: 300,
                transport: 160,
                flex: 302
            }
        };
    }
    
    budgetData.forEach(item => {
        const amount = parseFloat(item.amount) || 0;
        if (item.type === 'fixed') {
            config.fixedCosts[item.category] = amount;
        } else if (item.type === 'monthly') {
            config.discretionary[item.category] = amount;
        }
    });
    
    return config;
}

// Calculate financial metrics
function calculateFinancialMetrics() {
    // Current balance
    financialData.currentBalance = financialData.transactions.reduce((balance, transaction) => {
        const amount = parseFloat(transaction.amount) || 0;
        return transaction.type === 'income' ? balance + amount : balance - Math.abs(amount);
    }, 0);
    
    // Monthly spending (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    financialData.monthlySpending = financialData.transactions
        .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= thirtyDaysAgo && tx.type === 'payment';
        })
        .reduce((total, tx) => total + Math.abs(parseFloat(tx.amount) || 0), 0);
    
    // Amex progress
    const amexPayments = financialData.transactions
        .filter(tx => tx.category === 'amex' && tx.type === 'payment')
        .reduce((total, tx) => total + Math.abs(parseFloat(tx.amount) || 0), 0);
    
    financialData.amexProgress = amexPayments;
}

// Update dashboard
function updateDashboard() {
    // Update current balance
    document.getElementById('current-balance').textContent = 
        formatCurrency(financialData.currentBalance);
    
    // Update Amex progress
    const amexTarget = 2100;
    const progressPercent = Math.min((financialData.amexProgress / amexTarget) * 100, 100);
    document.getElementById('amex-progress').textContent = 
        `${formatCurrency(financialData.amexProgress)} / ${formatCurrency(amexTarget)}`;
    document.getElementById('amex-progress-bar').style.width = `${progressPercent}%`;
    
    // Update monthly spending
    document.getElementById('monthly-spending').textContent = 
        formatCurrency(financialData.monthlySpending);
    
    // Update recent transactions
    updateRecentTransactions();
}

// Update recent transactions list
function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions-list');
    const recentTransactions = financialData.transactions
        .slice(-10)
        .reverse();
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<p>No transactions yet. Add your first transaction above!</p>';
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-description">${transaction.description || 'No description'}</div>
                <div class="transaction-meta">
                    ${transaction.date} • ${transaction.category} • ${transaction.type}
                </div>
            </div>
            <div class="transaction-amount ${parseFloat(transaction.amount) < 0 ? 'negative' : 'positive'}">
                ${formatCurrency(transaction.amount)}
            </div>
        </div>
    `).join('');
}

// Update budget status
function updateBudgetStatus() {
    const container = document.getElementById('budget-status');
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const progress = dayOfMonth / daysInMonth;
    
    if (!financialData.budgetConfig.discretionary) {
        container.innerHTML = '<p>Budget configuration not loaded. Please check your Google Sheet.</p>';
        return;
    }
    
    const budgetHTML = Object.entries(financialData.budgetConfig.discretionary).map(([category, monthlyBudget]) => {
        const spent = financialData.transactions
            .filter(tx => tx.category === category && tx.type === 'payment')
            .reduce((total, tx) => total + Math.abs(parseFloat(tx.amount) || 0), 0);
        
        const projectedBudget = monthlyBudget * progress;
        const remaining = monthlyBudget - spent;
        const isOver = spent > projectedBudget;
        
        return `
            <div class="budget-category ${isOver ? 'over-budget' : 'under-budget'}">
                <div class="budget-header">
                    <span class="budget-name">${category.toUpperCase()}</span>
                    <span class="budget-amount">${formatCurrency(spent)} / ${formatCurrency(monthlyBudget)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min((spent / monthlyBudget) * 100, 100)}%"></div>
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.9rem;">
                    Remaining: ${formatCurrency(remaining)} | 
                    Status: ${isOver ? 'OVER BUDGET' : 'On Track'}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = budgetHTML;
}

// Add payment function
async function addPayment() {
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    
    if (!amount || !description || amount <= 0) {
        showError('Please fill in all fields with valid values');
        return;
    }
    
    try {
        showLoading('Adding payment to Google Sheets...');
        
        const transaction = {
            amount: -Math.abs(amount),
            description: description.trim(),
            category: category,
            type: 'payment',
            date: new Date().toISOString().split('T')[0]
        };
        
        // Try to save to Google Sheets
        try {
            await sheetsManager.addTransaction(transaction);
        } catch (sheetsError) {
            console.warn('Google Sheets save failed, using local storage:', sheetsError);
        }
        
        // Update local data
        transaction.id = sheetsManager.generateId();
        financialData.transactions.push(transaction);
        calculateFinancialMetrics();
        saveToLocalStorage();
        
        clearForm();
        hideLoading();
        showError('', false);
        alert('✅ Payment added successfully!');
        
        // Update UI
        updateDashboard();
        updateBudgetStatus();
        
    } catch (error) {
        hideLoading();
        showError('Failed to add payment: ' + error.message);
    }
}

// Add income function
async function addIncome() {
    const amount = parseFloat(document.getElementById('income-amount').value);
    const source = document.getElementById('income-source').value;
    
    if (!amount || !source || amount <= 0) {
        showError('Please fill in all fields with valid values');
        return;
    }
    
    try {
        showLoading('Adding income to Google Sheets...');
        
        const income = {
            amount: Math.abs(amount),
            source: source.trim(),
            type: 'income',
            date: new Date().toISOString().split('T')[0]
        };
        
        // Try to save to Google Sheets
        try {
            await sheetsManager.addIncome(income);
        } catch (sheetsError) {
            console.warn('Google Sheets save failed, using local storage:', sheetsError);
        }
        
        // Update local data
        income.id = sheetsManager.generateId();
        income.description = source;
        income.category = 'income';
        financialData.transactions.push(income);
        calculateFinancialMetrics();
        saveToLocalStorage();
        
        document.getElementById('income-amount').value = '';
        document.getElementById('income-source').value = '';
        hideLoading();
        showError('', false);
        alert('✅ Income added successfully!');
        
        // Update UI
        updateDashboard();
        
    } catch (error) {
        hideLoading();
        showError('Failed to add income: ' + error.message);
    }
}

// Navigation function
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Refresh data for specific sections
    if (sectionId === 'adjust-payment') {
        updateManageTransactions();
    }
    if (sectionId === 'view-status') {
        updateBudgetStatus();
    }
}

// Update manage transactions view
function updateManageTransactions() {
    const container = document.getElementById('manage-transactions-list');
    const transactions = financialData.transactions.slice().reverse();
    
    if (transactions.length === 0) {
        container.innerHTML = '<p>No transactions to manage.</p>';
        return;
    }
    
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-description">${transaction.description || 'No description'}</div>
                <div class="transaction-meta">
                    ${transaction.date} • ${transaction.category} • ${transaction.type}
                    ${transaction.id ? `<br><small>ID: ${transaction.id}</small>` : ''}
                </div>
            </div>
            <div class="transaction-amount ${parseFloat(transaction.amount) < 0 ? 'negative' : 'positive'}">
                ${formatCurrency(transaction.amount)}
            </div>
        </div>
    `).join('');
}

// Test Google Sheets connection
async function testSheetsConnection() {
    try {
        showLoading('Testing Google Sheets connection...');
        const result = await sheetsManager.testConnection();
        hideLoading();
        
        const statusElement = document.getElementById('sheets-status');
        statusElement.textContent = result.message;
        statusElement.className = `status-message ${result.success ? 'success' : 'error'}`;
        
    } catch (error) {
        hideLoading();
        showError('Connection test failed: ' + error.message);
    }
}

// Utility functions
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(num);
}

function showError(message, show = true) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.toggle('show', show);
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const messageElement = document.getElementById('loading-message');
    messageElement.textContent = message;
    overlay.classList.add('show');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('show');
}

function clearForm() {
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
}

// Local storage functions
function saveToLocalStorage() {
    localStorage.setItem('financial_data', JSON.stringify(financialData));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('financial_data');
    if (saved) {
        try {
            financialData = JSON.parse(saved);
            calculateFinancialMetrics();
            console.log('Data loaded from local storage');
        } catch (error) {
            console.error('Error loading from local storage:', error);
            // Initialize with empty data
            financialData = {
                transactions: [],
                budgetConfig: parseBudgetConfig([]),
                categories: [],
                goals: [],
                currentBalance: 0,
                monthlySpending: 0,
                amexProgress: 0
            };
        }
    }
}

function exportData() {
    const dataStr = JSON.stringify(financialData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function clearLocalData() {
    if (confirm('Are you sure you want to clear all local data? This will not affect your Google Sheets data.')) {
        localStorage.removeItem('financial_data');
        alert('Local data cleared. Page will reload.');
        window.location.reload();
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (localStorage.getItem('financial_tracker_auth')) {
        initializeApp();
    }
    
    // Add Enter key support for forms
    document.getElementById('amount')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addPayment();
    });
    
    document.getElementById('income-amount')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addIncome();
    });
});
