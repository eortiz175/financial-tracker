// email-parser.js - For future email automation
class EmailTransactionParser {
    constructor() {
        this.rules = this.loadCategoryRules();
    }
    
    loadCategoryRules() {
        // These would come from your Google Sheets categories
        return {
            'trader joe': 'groceries',
            'whole foods': 'groceries',
            'grocery': 'groceries',
            'lirr': 'transport',
            'nyct': 'transport',
            'omny': 'transport',
            'train': 'transport',
            'netflix': 'bills',
            'planet fitness': 'bills',
            'amex payment': 'amex',
            'capital one': 'capitalOne'
        };
    }
    
    parseEmailContent(content) {
        // Simple regex patterns for common transaction emails
        const patterns = [
            /(\d+\.\d{2})\s+at\s+([^\.]+)/i,
            /[\$](\d+\.\d{2})\s+.*?at\s+([^\.]+)/i,
            /charged\s+\$?(\d+\.\d{2})\s+at\s+([^\.]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                const amount = parseFloat(match[1]);
                const merchant = match[2].trim();
                const category = this.categorizeTransaction(merchant);
                
                return {
                    amount: -amount, // Negative for payments
                    description: merchant,
                    category: category,
                    type: 'payment',
                    date: new Date().toISOString().split('T')[0]
                };
            }
        }
        
        return null;
    }
    
    categorizeTransaction(merchant) {
        const merchantLower = merchant.toLowerCase();
        
        for (const [keyword, category] of Object.entries(this.rules)) {
            if (merchantLower.includes(keyword)) {
                return category;
            }
        }
        
        return 'flex'; // Default category
    }
}

// Create global instance for future use
const emailParser = new EmailTransactionParser();
