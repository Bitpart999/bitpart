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
const previewBtn = document.getElementById('previewBtn');
const previewContainer = document.getElementById('previewContainer');
const livePreview = document.getElementById('livePreview');

// State
let isGenerating = false;
let lastGeneratedCode = '';

// Event Listeners
generateBtn.addEventListener('click', generateCode);
copyBtn.addEventListener('click', copyCode);
previewBtn.addEventListener('click', showPreview);
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

    if (isGenerating) return;

    try {
        setGenerating(true);
        hideError();
        hideResult();
        hidePreview();

        const startTime = Date.now();

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                options: { temperature: 0.7, maxTokens: 4000 }
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

    lastGeneratedCode = codeData.code || '';
    codeOutput.textContent = lastGeneratedCode;

    languageTag.textContent = codeData.language || 'Unknown';
    languageTag.className = `language-tag ${ (codeData.language || '').toLowerCase() }`;

    const serverTime = meta.responseTime || 0;
    responseTime.textContent = `Client: ${clientResponseTime}ms | Server: ${serverTime}ms`;

    explanationText.textContent = codeData.explanation || 'No explanation provided';

    const dependencies = codeData.dependencies || [];
    if (dependencies.length > 0) {
        dependenciesList.innerHTML = dependencies
            .map(dep => `<li><code>${escapeHtml(dep)}</code></li>`)
            .join('');
        document.querySelector('.dependencies-section').style.display = 'block';
    } else {
        document.querySelector('.dependencies-section').style.display = 'none';
    }

    instructionsText.textContent = codeData.instructions || 'No specific instructions provided';

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
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);

    } catch (error) {
        console.error('Failed to copy code:', error);

        const range = document.createRange();
        range.selectNode(codeOutput);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        showError('Please manually copy the selected code');
    }
}

// Show live preview
function showPreview() {
    if (!lastGeneratedCode) {
        showError('No code available to preview');
        return;
    }

    const html = `
        <html>
        <head><style>body { margin: 1rem; font-family: sans-serif; }</style></head>
        <body>
        ${lastGeneratedCode}
        <script>${extractJS(lastGeneratedCode)}</script>
        </body>
        </html>
    `;

    livePreview.srcdoc = html;
    previewContainer.classList.remove('hidden');
}

function hidePreview() {
    previewContainer.classList.add('hidden');
    livePreview.srcdoc = '';
}

// Extract <script> content if embedded at the bottom
function extractJS(code) {
    const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    return match ? match[1] : '';
}

// UI State Management
function setGenerating(generating) {
    isGenerating = generating;
    generateBtn.disabled = generating;
    generateBtn.textContent = generating ? 'Generating...' : 'Generate Code';
    promptInput.disabled = generating;

    loadingIndicator.classList.toggle('hidden', !generating);
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
