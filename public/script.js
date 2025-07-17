const generateBtn = document.getElementById('generateBtn');
const promptInput = document.getElementById('promptInput');
const loadingMsg = document.getElementById('loadingMsg');
const errorMsg = document.getElementById('errorMsg');
const resultSection = document.getElementById('resultSection');
const codeOutput = document.getElementById('codeOutput');
const copyBtn = document.getElementById('copyBtn');
const previewBtn = document.getElementById('previewBtn');
const previewContainer = document.getElementById('previewContainer');
const previewFrame = document.getElementById('previewFrame');

let lastGeneratedCode = '';

generateBtn.addEventListener('click', async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    showError('Please enter a prompt.');
    return;
  }

  showLoading();
  hideError();
  hideResult();

  try {
    const response = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (data && data.code) {
      lastGeneratedCode = data.code;
      codeOutput.textContent = data.code;
      showResult();
    } else {
      throw new Error('Invalid response from server.');
    }
  } catch (err) {
    showError('Failed to generate code. Please try again.');
    console.error(err);
  } finally {
    hideLoading();
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeOutput.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy to Clipboard'), 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
});

previewBtn.addEventListener('click', showPreview);

function showLoading() {
  loadingMsg.classList.remove('hidden');
}

function hideLoading() {
  loadingMsg.classList.add('hidden');
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}

function hideError() {
  errorMsg.textContent = '';
  errorMsg.classList.add('hidden');
}

function showResult() {
  resultSection.classList.remove('hidden');
}

function hideResult() {
  resultSection.classList.add('hidden');
  previewContainer.classList.add('hidden');
  previewBtn.textContent = 'Preview Code';
}

function showPreview() {
  if (!lastGeneratedCode) {
    showError('No code available to preview.');
    return;
  }

  previewFrame.srcdoc = lastGeneratedCode;
  previewContainer.classList.remove('hidden');
  previewBtn.textContent = "Refresh Preview";
}
