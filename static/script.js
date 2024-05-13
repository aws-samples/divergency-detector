
const isDarkMode = localStorage.getItem('isDarkMode') === 'true';
const form = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const responseContainer = document.getElementById('response-container');
const loaderContainer = document.querySelector('.loader-container');
const body = document.querySelector('body');
const MAX_INTERACTIONS_PER_PAGE = 3;
const darkModeToggle = document.getElementById('dark-mode-toggle');
const fileNameSpan = document.getElementById('file-name');
const initialState = document.getElementById('initial-state');
const mainContent = document.getElementById('main-content');
const tryAnotherFileButton = document.getElementById('try-another-file');
const paginationContainer = document.getElementById('pagination-container');

let currentPage = 0;
const pages = [];

// Load interactions from localStorage
const storedInteractions = JSON.parse(localStorage.getItem('interactions')) || [];
const interactions = storedInteractions.map(interaction => ({
  ...interaction,
  timestamp: new Date(interaction.timestamp).getTime()
}));

updatePages();
displayInteractions();
toggleDarkMode(isDarkMode);

fileInput.addEventListener('change', async function() {
  const fileName = this.files[0].name;

  fileNameSpan.textContent = fileName;

  // Show the loader container
  loaderContainer.style.display = 'flex';

  try {
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const response = await fetch('/process', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    const timestamp = new Date().getTime();
    const interaction = { fileName, data, timestamp };
    interactions.push(interaction); // Add new interaction at the end
    updatePages();
    displayInteractions();
    saveInteractionsToLocalStorage();

    initialState.style.display = 'none';
    mainContent.style.display = 'block';
    paginationContainer.style.display = 'flex'; // Show the pagination container
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Hide the loader container
    loaderContainer.style.display = 'none';
  }
});
function displayInteractions() {
  responseContainer.innerHTML = '';
  // Display the current page
  const currentPageInteractions = pages[currentPage];
  if (currentPageInteractions) {
    for (const interaction of currentPageInteractions) {
      const interactionElement = document.createElement('div');
      interactionElement.classList.add('interaction');

      const headerElement = document.createElement('div');
      headerElement.classList.add('interaction-header');
      const fileNameElement = document.createElement('span');
      fileNameElement.classList.add('file-name');
      fileNameElement.textContent = `Arquivo: ${interaction.fileName}`;
      const timeSinceUploadElement = document.createElement('span');
      const timeSinceUpload = getTimeSinceUpload(interaction.timestamp);
      timeSinceUploadElement.textContent = timeSinceUpload;
      headerElement.appendChild(fileNameElement);
      headerElement.appendChild(timeSinceUploadElement);
      interactionElement.appendChild(headerElement);

      if (interaction.data.length === 0) {
        const noResultsElement = document.createElement('div');
        noResultsElement.classList.add('no-results');
        noResultsElement.textContent = 'No statements classified as false in this document.';
        interactionElement.appendChild(noResultsElement);
      } else {
        const itemContainerFragment = document.createDocumentFragment();
        let itemNumber = 1;
        for (const record of interaction.data) {
          const itemContainer = document.createElement('div');
          itemContainer.classList.add('item-container');

          const itemHeaderElement = document.createElement('div');
          itemHeaderElement.classList.add('item-header');
          const itemNumberElement = document.createElement('div');
          itemNumberElement.classList.add('item-number');
          itemNumberElement.textContent = itemNumber;
          const sourceFileContainer = document.createElement('div');
          sourceFileContainer.classList.add('source-file-container');
          const sourceFileTooltip = document.createElement('span');
          sourceFileTooltip.classList.add('source-file-tooltip');
          sourceFileTooltip.textContent = record.sourceFileName || 'N/A';
          const sourceFileLabel = document.createElement('span');
          sourceFileLabel.classList.add('source-file-label');
          sourceFileLabel.textContent = 'Fonte';
          sourceFileContainer.appendChild(sourceFileTooltip);
          sourceFileContainer.appendChild(sourceFileLabel);
          
          itemHeaderElement.appendChild(sourceFileContainer);
          
          itemHeaderElement.appendChild(sourceFileContainer);
          itemHeaderElement.appendChild(itemNumberElement);
          itemContainer.appendChild(itemHeaderElement);

          for (const [key, value] of Object.entries(record)) {
            if (key === 'statement') {
              const statementCell = document.createElement('div');
              statementCell.classList.add('cell', 'statement');
              const statementLabelCell = document.createElement('span');
              statementLabelCell.classList.add('cell-label');
              statementLabelCell.textContent = 'Declaração:';
              statementCell.appendChild(statementLabelCell);
              const statementValueCell = document.createElement('div');
              statementValueCell.classList.add('cell-value');
              statementValueCell.textContent = value;
              statementCell.appendChild(statementValueCell);
              itemContainer.appendChild(statementCell);
            }
          }

          for (const [key, value] of Object.entries(record)) {
            if (key === 'justification') {
              const divergenceCell = document.createElement('div');
              divergenceCell.classList.add('cell', 'divergence');
              const divergenceLabelCell = document.createElement('span');
              divergenceLabelCell.classList.add('cell-label');
              divergenceLabelCell.textContent = 'Divergência:';
              divergenceCell.appendChild(divergenceLabelCell);
              const divergenceValueCell = document.createElement('div');
              divergenceValueCell.classList.add('cell-value');
              divergenceValueCell.textContent = value;
              divergenceCell.appendChild(divergenceValueCell);
              itemContainer.appendChild(divergenceCell);
            }
          }

          itemContainerFragment.appendChild(itemContainer);
          itemNumber++;
        }
        interactionElement.appendChild(itemContainerFragment);
      }
      responseContainer.appendChild(interactionElement);
    }
  }

  // Add pagination controls
  const paginationContainer = document.getElementById('pagination-container');
  paginationContainer.innerHTML = '';

  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.disabled = currentPage === 0;
  prevButton.addEventListener('click', () => {
    currentPage--;
    displayInteractions();
  });
  paginationContainer.appendChild(prevButton);

  const pageNumbers = document.createElement('div');
  for (let i = 0; i < pages.length; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i + 1;
    pageButton.disabled = i === currentPage;
    pageButton.addEventListener('click', () => {
      currentPage = i;
      displayInteractions();
    });
    pageNumbers.appendChild(pageButton);
  }
  paginationContainer.appendChild(pageNumbers);

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.disabled = currentPage === pages.length - 1;
  nextButton.addEventListener('click', () => {
    currentPage++;
    displayInteractions();
  });
  paginationContainer.appendChild(nextButton);
}

function getTimeSinceUpload(timestamp) {
  const now = new Date().getTime();
  const diffInMilliseconds = now - timestamp;
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  if (diffInMinutes < 1) {
    return 'Agora';
  } else if (diffInMinutes === 1) {
    return '1 minuto atrás';
  } else {
    return `${diffInMinutes} minutos atrás`;
  }
}

function saveInteractionsToLocalStorage() {
  const serializedInteractions = interactions.map(interaction => ({
    ...interaction,
    timestamp: new Date(interaction.timestamp).toISOString()
  }));
  localStorage.setItem('interactions', JSON.stringify(serializedInteractions));
}

function updatePages() {
  // Sort interactions in descending order by timestamp
  interactions.sort((a, b) => b.timestamp - a.timestamp);
  pages.length = 0;
  for (let i = 0; i < interactions.length; i += MAX_INTERACTIONS_PER_PAGE) {
    pages.push(interactions.slice(i, i + MAX_INTERACTIONS_PER_PAGE));
  }
}

function toggleDarkMode(isDarkMode) {
  const elements = document.querySelectorAll('.dark-mode-element');
  if (isDarkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
    elements.forEach(element => element.classList.add('dark-mode'));
  } else {
    body.classList.remove('dark-mode');
    darkModeToggle.textContent = '🌙';
    elements.forEach(element => element.classList.remove('dark-mode'));
  }
}

darkModeToggle.addEventListener('click', () => {
  const isDarkMode = body.classList.contains('dark-mode');
  toggleDarkMode(!isDarkMode);
  localStorage.setItem('isDarkMode', !isDarkMode);
});

const dropZone = document.querySelector('.drop-zone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    fileInput.files = e.dataTransfer.files;
    const fileName = file.name;
    fileNameSpan.textContent = fileName;
});


fileInput.addEventListener('change', function() {
  initialState.style.display = 'none';
  mainContent.style.display = 'block';
});

tryAnotherFileButton.addEventListener('click', function() {
  initialState.style.display = 'flex';
  mainContent.style.display = 'none';
  paginationContainer.style.display = 'none'; // Hide the pagination container
  fileInput.value = ''; // Clear the selected file
  fileNameSpan.textContent = ''; // Clear the file name
});