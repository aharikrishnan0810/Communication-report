// ===========================
// DOM ELEMENTS
// ===========================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const removeFileBtn = document.getElementById('removeFileBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const uploadForm = document.getElementById('uploadForm');
const generateBtn = document.getElementById('generateBtn');
const internNameInput = document.getElementById('internName');
const uploadSection = document.getElementById('uploadSection');
const reportSection = document.getElementById('reportSection');
const reportDescription = document.getElementById('reportDescription');
const skillsGrid = document.getElementById('skillsGrid');
const strengthsList = document.getElementById('strengthsList');
const weaknessesList = document.getElementById('weaknessesList');
const recommendationsList = document.getElementById('recommendationsList');
const motivationalText = document.getElementById('motivationalText');
const newReportBtn = document.getElementById('newReportBtn');

// ===========================
// STATE
// ===========================
let selectedFile = null;
let internNames = ['overall']; // Will be populated from Excel file
let selectedInternName = 'overall';

// Get autocomplete elements
const autocompleteDropdown = document.getElementById('autocompleteDropdown');

// ===========================
// API CONFIGURATION
// ===========================
const API_URL = '/report-upload';


// ===========================
// SKILL ICONS MAPPING
// ===========================
const skillIcons = {
    'Pronunciation Avg': 'fa-microphone',
    'Grammar Avg': 'fa-book',
    'Vocabulary Avg': 'fa-language',
    'Fluency Avg': 'fa-comments',
    'Confidence Avg': 'fa-user-tie',
    'Body Language Avg': 'fa-hands'
};

// ===========================
// FILE UPLOAD HANDLERS
// ===========================

// Browse button click
browseBtn.addEventListener('click', () => {
    fileInput.click();
});

// Drop zone click
dropZone.addEventListener('click', (e) => {
    if (e.target !== removeFileBtn && !removeFileBtn.contains(e.target)) {
        fileInput.click();
    }
});

// File input change
fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

// Drag and drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
});

// Remove file button
removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFile();
});

// ===========================
// FILE HANDLING FUNCTIONS
// ===========================
function handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid Excel file (.xlsx or .xls)');
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;

    // Show file info, hide drop zone content
    document.querySelector('.drop-zone-content').style.display = 'none';
    fileInfo.style.display = 'flex';

    // Extract intern names from Excel file
    extractInternNames(file);

    // Enable generate button and autocomplete
    generateBtn.disabled = false;
    internNameInput.disabled = false;
    internNameInput.placeholder = 'Type to search...';
}

function removeFile() {
    selectedFile = null;
    fileInput.value = '';

    // Hide file info, show drop zone content
    fileInfo.style.display = 'none';
    document.querySelector('.drop-zone-content').style.display = 'block';

    // Reset autocomplete
    internNames = ['overall'];
    selectedInternName = 'overall';
    internNameInput.value = '';
    internNameInput.disabled = true;
    internNameInput.placeholder = 'Type to search or select \'overall\'';
    populateAutocomplete();

    // Disable generate button
    generateBtn.disabled = true;
}

// ===========================
// AUTOCOMPLETE FUNCTIONS
// ===========================

// Extract intern names from Excel file
async function extractInternNames(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        // Read the file using FileReader
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                // We'll use a simple approach - send to backend to get names
                // For now, let's create a temporary endpoint call
                const response = await fetch('/get-intern-names', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Intern names received:", data); // Debug log
                    internNames = ['overall', ...data.names];
                } else {
                    console.error("Failed to get names, status:", response.status);
                    // Fallback: just enable with overall
                    internNames = ['overall'];
                }
            } catch (error) {
                console.error('Could not extract names, using overall only', error);
                internNames = ['overall'];
            }

            // Populate autocomplete dropdown
            populateAutocomplete();

            // Set default to overall
            selectedInternName = 'overall';
            internNameInput.value = 'Overall Report';
        };

        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Error extracting intern names:', error);
        internNames = ['overall'];
        populateAutocomplete();
    }
}

// Populate autocomplete dropdown
function populateAutocomplete(filter = '') {
    autocompleteDropdown.innerHTML = '';

    // Always show overall first
    const overallItem = document.createElement('div');
    overallItem.className = 'autocomplete-item';
    overallItem.setAttribute('data-value', 'overall');
    overallItem.innerHTML = `
        <i class="fas fa-users"></i>
        <span><strong>Overall Report</strong> - All Interns</span>
    `;
    overallItem.addEventListener('mousedown', () => selectIntern('overall', 'Overall Report'));
    autocompleteDropdown.appendChild(overallItem);

    // Filter and display intern names
    const filteredNames = internNames
        .filter(name => name !== 'overall')
        .filter(name => name.toLowerCase().includes(filter.toLowerCase()));

    filteredNames.forEach(name => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.setAttribute('data-value', name);
        item.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${name}</span>
        `;
        item.addEventListener('mousedown', () => selectIntern(name, name));
        autocompleteDropdown.appendChild(item);
    });

    // Show "no results" if nothing matches
    if (filteredNames.length === 0 && filter && filter.toLowerCase() !== 'overall') {
        const noResults = document.createElement('div');
        noResults.className = 'autocomplete-no-results';
        noResults.textContent = 'No matching interns found';
        autocompleteDropdown.appendChild(noResults);
    }
}

// Select an intern from dropdown
function selectIntern(value, displayText) {
    selectedInternName = value;
    internNameInput.value = displayText;
    autocompleteDropdown.classList.remove('active');
}

// Show dropdown
function showAutocomplete() {
    if (!internNameInput.disabled) {
        autocompleteDropdown.classList.add('active');
    }
}

// Hide dropdown
function hideAutocomplete() {
    setTimeout(() => {
        autocompleteDropdown.classList.remove('active');
    }, 200);
}

// Autocomplete input event listeners
internNameInput.addEventListener('focus', () => {
    showAutocomplete();
    internNameInput.select();
});

internNameInput.addEventListener('blur', hideAutocomplete);

internNameInput.addEventListener('input', (e) => {
    const value = e.target.value;
    populateAutocomplete(value);
    showAutocomplete();
});

// Click outside to close
document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-container')) {
        autocompleteDropdown.classList.remove('active');
    }
});

// ===========================
// FORM SUBMISSION
// ===========================
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
        alert('Please select a file first');
        return;
    }

    // Use the selected intern name from autocomplete
    const internName = selectedInternName || 'overall';

    // Show loading state
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoader = generateBtn.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    generateBtn.disabled = true;

    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', internName);

        // Make API request
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to generate report');
        }

        const data = await response.json();

        // Display report
        displayReport(data, internName);

        // Scroll to report
        setTimeout(() => {
            reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        // Reset button state
        btnText.style.display = 'inline-flex';
        btnLoader.style.display = 'none';
        generateBtn.disabled = false;
    }
});

// ===========================
// REPORT DISPLAY
// ===========================
function displayReport(data, internName) {
    // Update description
    if (data.type === 'overall') {
        reportDescription.textContent = 'Comprehensive analysis of all interns';
    } else {
        reportDescription.textContent = `Individual analysis for ${data.name || internName}`;
    }

    // Display skills
    displaySkills(data.evaluated);

    // Display AI insights
    displayInsights(data);

    // Show report section
    reportSection.style.display = 'block';
}

function displaySkills(evaluated) {
    skillsGrid.innerHTML = '';

    // Rating to percentage mapping
    const ratingToPercentage = {
        'Excellent': 95,
        'Good': 75,
        'Average': 55,
        'Below Average': 30
    };

    // Rating to class mapping
    const ratingToClass = {
        'Excellent': 'rating-excellent',
        'Good': 'rating-good',
        'Average': 'rating-average',
        'Below Average': 'rating-below'
    };

    for (const [skill, rating] of Object.entries(evaluated)) {
        const percentage = ratingToPercentage[rating] || 50;
        const ratingClass = ratingToClass[rating] || 'rating-average';
        const icon = skillIcons[skill] || 'fa-chart-bar';

        const skillCard = document.createElement('div');
        skillCard.className = 'skill-card';
        skillCard.innerHTML = `
            <div class="skill-header">
                <div class="skill-name">
                    <i class="fas ${icon} skill-icon"></i>
                    ${skill.replace(' Avg', '')}
                </div>
                <span class="skill-rating ${ratingClass}">${rating}</span>
            </div>
            <div class="skill-progress">
                <div class="skill-progress-bar" style="width: 0%;" data-width="${percentage}%"></div>
            </div>
        `;

        skillsGrid.appendChild(skillCard);
    }

    // Animate progress bars
    setTimeout(() => {
        document.querySelectorAll('.skill-progress-bar').forEach(bar => {
            bar.style.width = bar.dataset.width;
        });
    }, 100);
}

function displayInsights(data) {
    // Strengths
    strengthsList.innerHTML = '';
    if (data.strengths && Array.isArray(data.strengths)) {
        data.strengths.forEach(strength => {
            const li = document.createElement('li');
            li.textContent = strength;
            strengthsList.appendChild(li);
        });
    } else {
        strengthsList.innerHTML = '<li>No strengths data available</li>';
    }

    // Weaknesses
    weaknessesList.innerHTML = '';
    if (data.weaknesses && Array.isArray(data.weaknesses)) {
        data.weaknesses.forEach(weakness => {
            const li = document.createElement('li');
            li.textContent = weakness;
            weaknessesList.appendChild(li);
        });
    } else {
        weaknessesList.innerHTML = '<li>No weaknesses data available</li>';
    }

    // Recommendations
    recommendationsList.innerHTML = '';
    if (data.recommendations && Array.isArray(data.recommendations)) {
        data.recommendations.forEach(recommendation => {
            const li = document.createElement('li');
            li.textContent = recommendation;
            recommendationsList.appendChild(li);
        });
    } else {
        recommendationsList.innerHTML = '<li>No recommendations available</li>';
    }

    // Motivational note
    if (data.motivational_note) {
        motivationalText.textContent = data.motivational_note;
    } else {
        motivationalText.textContent = 'Keep up the great work! Every step forward is progress.';
    }
}

// ===========================
// NEW REPORT BUTTON
// ===========================
newReportBtn.addEventListener('click', () => {
    // Hide report section
    reportSection.style.display = 'none';

    // Reset form (removeFile handles autocomplete reset)
    removeFile();

    // Scroll to upload section
    uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ===========================
// SMOOTH ANIMATIONS ON LOAD
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Add entrance animations
    const uploadCard = document.querySelector('.upload-card');
    uploadCard.style.opacity = '0';
    uploadCard.style.transform = 'translateY(20px)';

    setTimeout(() => {
        uploadCard.style.transition = 'all 0.5s ease-out';
        uploadCard.style.opacity = '1';
        uploadCard.style.transform = 'translateY(0)';
    }, 100);
});
