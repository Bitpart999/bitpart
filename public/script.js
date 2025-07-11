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
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to generate code');
        }
        
        displayResult(data, clientResponseTime);
        
    } catch (error) {
        console.error('Error generating code:', error);
        showError(getErrorMessage(error));
    } finally {
        setGenerating(false);
    }
}

// Display the generated code result
function displayResult(data, clientResponseTime) {
    const { data: codeData, meta } = data;
    
    // Store the generated code for copying
    lastGeneratedCode = codeData.code || '';
    
    // Display code
    codeOutput.textContent = lastGeneratedCode;
    
    // Display language tag
    languageTag.textContent = codeData.language || 'Unknown';
    languageTag.className = `language-tag ${(codeData.language || '').toLowerCase()}`;
    
    // Display response time
    const serverTime = meta.responseTime || 0;
    responseTime.textContent = `Client: ${clientResponseTime}ms | Server: ${serverTime}ms`;
    
    // Display explanation
    explanationText.textContent = codeData.explanation || 'No explanation provided';
    
    // Display dependencies
    const dependencies = codeData.dependencies || [];
    if (dependencies.length > 0) {
        dependenciesList.innerHTML = dependencies
            .map(dep => `<li><code>${escapeHtml(dep)}</code></li>`)
            .join('');
        document.querySelector('.dependencies-section').style.display = 'block';
    } else {
        document.querySelector('.dependencies-section').style.display = 'none';
    }
    
    // Display instructions
    instructionsText.textContent = codeData.instructions || 'No specific instructions provided';
    
    // Show result section
    showResult();
}

// Copy code to clipboard
async function copyCode() {
    if (!lastGeneratedCode) {
        showError('No code to copy');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(lastGeneratedCode);
        
        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy code:', error);
        
        // Fallback: select the text
        const range = document.createRange();
        range.selectNode(codeOutput);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        showError('Please manually copy the selected code');
    }
}

// UI State Management
function setGenerating(generating) {
    isGenerating = generating;
    generateBtn.disabled = generating;
    generateBtn.textContent = generating ? 'Generating...' : 'Generate Code';
    promptInput.disabled = generating;
    
    if (generating) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showResult() {
    resultSection.classList.remove('hidden');
}

function hideResult() {
    resultSection.classList.add('hidden');
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getErrorMessage(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return 'Connection error. Please check if the server is running.';
    }
    
    if (error.message.includes('Rate limit exceeded')) {
        return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (error.message.includes('API key')) {
        return 'API configuration error. Please check the server configuration.';
    }
    
    if (error.message.includes('quota')) {
        return 'API quota exceeded. Please check your OpenAI account billing.';
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
}

// Add some keyboard shortcuts info
document.addEventListener('DOMContentLoaded', () => {
    // Add tooltip for keyboard shortcut
    promptInput.title = 'Ctrl+Enter (or Cmd+Enter) to generate code';
});