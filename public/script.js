// Updated JavaScript with full Easy Builder support, advanced UI features, and all previously requested functionality retained

const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const previewBtn = document.getElementById('previewBtn');
const copyBtn = document.getElementById('copyBtn');
const codeOutput = document.getElementById('codeOutput');
const languageTag = document.getElementById('languageTag');
const explanationText = document.getElementById('explanationText');
const dependenciesList = document.getElementById('dependenciesList');
const instructionsText = document.getElementById('instructionsText');
const resultSection = document.getElementById('resultSection');
const previewContainer = document.getElementById('previewContainer');
const livePreview = document.getElementById('livePreview');
const responseTime = document.getElementById('responseTime');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');

const builderMode = document.getElementById('builderMode');
const promptMode = document.getElementById('promptMode');
const modeRadios = document.getElementsByName('mode');

const includeHeader = document.getElementById('includeHeader');
const headerFields = document.getElementById('headerFields');
const headerText = document.getElementById('headerText');

const includeHero = document.getElementById('includeHero');
const heroFields = document.getElementById('heroFields');
const heroTitle = document.getElementById('heroTitle');
const heroSubtitle = document.getElementById('heroSubtitle');

const includeAbout = document.getElementById('includeAbout');
const aboutFields = document.getElementById('aboutFields');
const aboutText = document.getElementById('aboutText');

const includeServices = document.getElementById('includeServices');
const servicesFields = document.getElementById('servicesFields');
const serviceList = document.getElementById('serviceList');

const includeGallery = document.getElementById('includeGallery');
const galleryFields = document.getElementById('galleryFields');
const galleryImages = document.getElementById('galleryImages');

const includeContact = document.getElementById('includeContact');
const contactFields = document.getElementById('contactFields');
const contactEmail = document.getElementById('contactEmail');
const contactPhone = document.getElementById('contactPhone');

const includeFAQs = document.getElementById('includeFAQs');
const faqFields = document.getElementById('faqFields');
const faqList = document.getElementById('faqList');

const API_ENDPOINT = 'https://bitpart-1.onrender.com/api/generate';

let isGenerating = false;
let lastGeneratedCode = '';

modeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'prompt') {
      promptMode.classList.remove('hidden');
      builderMode.classList.add('hidden');
    } else {
      promptMode.classList.add('hidden');
      builderMode.classList.remove('hidden');
    }
  });
});

function toggleFields(checkbox, section) {
  checkbox.addEventListener('change', () => {
    section.classList.toggle('hidden', !checkbox.checked);
  });
}

toggleFields(includeHeader, headerFields);
toggleFields(includeHero, heroFields);
toggleFields(includeAbout, aboutFields);
toggleFields(includeServices, servicesFields);
toggleFields(includeGallery, galleryFields);
toggleFields(includeContact, contactFields);
toggleFields(includeFAQs, faqFields);

generateBtn.addEventListener('click', generateCode);
copyBtn.addEventListener('click', copyCode);
previewBtn.addEventListener('click', showPreview);

async function generateCode() {
  let prompt = '';
  const currentMode = document.querySelector('input[name="mode"]:checked').value;

  if (currentMode === 'prompt') {
    prompt = promptInput.value.trim();
  } else {
    prompt = buildPromptFromBuilder();
  }

  if (!prompt) {
    showError('Please provide a prompt or select components.');
    return;
  }

  if (isGenerating) return;

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
        previousCode: lastGeneratedCode,
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

function buildPromptFromBuilder() {
  const parts = [];

  if (includeHeader.checked && headerText.value.trim()) {
    parts.push(`Add a header that says "${headerText.value.trim()}"`);
  }

  if (includeHero.checked) {
    const title = heroTitle.value.trim();
    const subtitle = heroSubtitle.value.trim();
    if (title || subtitle) {
      parts.push(`Include a hero section with title "${title}" and subtitle "${subtitle}"`);
    }
  }

  if (includeAbout.checked && aboutText.value.trim()) {
    parts.push(`Include an about section with text: "${aboutText.value.trim()}"`);
  }

  if (includeServices.checked && serviceList.value.trim()) {
    parts.push(`Add a services section listing: ${serviceList.value.trim()}`);
  }

  if (includeGallery.checked && galleryImages.value.trim()) {
    parts.push(`Include a gallery with these images: ${galleryImages.value.trim()}`);
  }

  if (includeContact.checked) {
    const contactParts = [];
    if (contactEmail.checked) contactParts.push("email");
    if (contactPhone.checked) contactParts.push("phone number");
    if (contactParts.length > 0) {
      parts.push(`Include a contact section with ${contactParts.join(" and ")}`);
    }
  }

  if (includeFAQs.checked && faqList.value.trim()) {
    parts.push(`Add a FAQs section with: ${faqList.value.trim()}`);
  }

  return parts.join('. ') + '.';
}

function displayResult(data, responseTimeMs) {
  lastGeneratedCode = data.code || '';
  codeOutput.textContent = lastGeneratedCode;
  languageTag.textContent = data.language || '';
  explanationText.textContent = data.explanation || '';
  instructionsText.textContent = data.instructions || '';
  responseTime.textContent = `⏱️ Generated in ${responseTimeMs}ms`;

  dependenciesList.innerHTML = '';
  if (data.dependencies && data.dependencies.length > 0) {
    data.dependencies.forEach(dep => {
      const li = document.createElement('li');
      li.textContent = dep;
      dependenciesList.appendChild(li);
    });
  }

  resultSection.classList.remove('hidden');
  previewContainer.classList.remove('hidden');
  showPreview();
}

function copyCode() {
  const code = codeOutput.textContent;
  if (!code) return;

  navigator.clipboard.writeText(code).then(() => {
    alert('Code copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy code: ', err);
  });
}

function showPreview() {
  const html = lastGeneratedCode;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  livePreview.src = url;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.textContent = '';
  errorMessage.classList.add('hidden');
}

function hideResult() {
  resultSection.classList.add('hidden');
  previewContainer.classList.add('hidden');
}

function setGenerating(isLoading) {
  isGenerating = isLoading;
  loadingIndicator.classList.toggle('hidden', !isLoading);
  generateBtn.disabled = isLoading;
}

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
