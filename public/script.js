// API Configuration
const API_BASE_URL = window.location.origin;
const API_ENDPOINT = `${API_BASE_URL}/api/compile`;

// DOM Elements
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const resultSection = document.getElementById('resultSection');
const codeOutput = document.getElementById('codeOutput');
const languageTag = document.getElementById('languageTag');
const responseTime = document.getElementById('responseTime');
const explanationText = document.getElementById('explanationText');
const dependenciesList = document.getElementById('dependenciesList');
const instructionsText = document.getElementById('instructionsText');
const copyBtn = document.getElementById('copyBtn');

// State
let isGenerating = false;
let lastGeneratedCode = '';

// Event Listeners
generateBtn.addEventListener('click', generateCode);
copyBtn.addEventListener('click', copyCode);
promptInput.addEventListener('keydown', handleKeyDown);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    promptInput.focus();
    promptInput.title = 'Ctrl+Enter (or Cmd+Enter) to generate code';
});

// Handle Enter key in textarea (Ctrl+Enter or Cmd+Enter to generate)
function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        generateCode();
    }
}

// Main function to generate code
async function generateCode() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        showError('Please enter a description of what you want to build.');
        return;
    }
    
    if (isGenerating) {
        return;
    }
    
    try {
        setGenerating(true);
        hideError();
        hideResult();
        
        const startTime = Date.now();
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                options: {
                    temperature: 0.7,
                    maxTokens: 4000
                }
            })
        });
        
        const endTime = Date.now();
        const clientResponseTime = endTime - startTime;
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        
        const data = await respon
