document.addEventListener('DOMContentLoaded', () => {
    // Load spells automatically for the default selected class on page load
    const classSelect = document.getElementById('class-select');
    // fetchSpells(classSelect.value);

    // Add event listeners to spells and other elements
    document.getElementById('create-pdf').addEventListener('click', generatePDF);

    // Class selection event
    classSelect.addEventListener('change', (event) => {
        deselectAllSpells();
        fetchSpells(event.target.value);
    });
});

// Fetch spells from the backend based on the selected class
function fetchSpells(selectedClass, callback = ()=>{}) {
    document.body.classList.add('loading');
    fetch(`/spells?class=${selectedClass}`) // Adjust the URL according to your backend API
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            displaySpells(data);
        })
        .catch(error => console.error('Error fetching spells:', error)).finally(() => {
            document.body.classList.remove('loading'); // Remove loading cursor
        }).
        finally(callback);
}

// Display spells in the UI
function displaySpells(spells) {
    const spellsContainer = document.getElementById('spells-container');
    spellsContainer.innerHTML = ''; // Clear previous spells

    Object.keys(spells).forEach(level => {
        const levelHeader = document.createElement('h3');
        levelHeader.textContent = `Level ${level}`;
        spellsContainer.appendChild(levelHeader);

        const levelDiv = document.createElement('div');
        levelDiv.classList.add('col-md-12', 'mb-3'); // Bootstrap classes for layout

        spells[level].forEach(spell => {
            const spellCard = document.createElement('div');
            spellCard.classList.add('card', 'mb-2');
            spellCard.innerHTML = `<div class="card-body">
                <h5 class="card-title">${spell.name}</h5>
                <a target="_blank" href="${spell.description}" class="card-text">Link</a>
            </div>`;

            spellCard.addEventListener('click', () => {
                toggleSpellSelection(spellCard, spell, level);
            });

            levelDiv.appendChild(spellCard);
        });

        spellsContainer.appendChild(levelDiv);
    });

    document.querySelectorAll('.card a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.stopPropagation(); // Stop the click from propagating to the card
        });
    });
}

function toggleSpellSelection(card, spell, level) {
    card.classList.toggle('selected');
    const selectedList = document.getElementById('selected-list');

    // Check if the level section exists in the selected spells list
    let levelSection = selectedList.querySelector(`.level-${level}`);
    if (!levelSection) {
        // If not, create it
        const levelHeader = document.createElement('h3'); // Create a new header
        levelHeader.textContent = `Level ${level}`; // Set header text
        levelSection = document.createElement('ul');
        levelSection.classList.add('list-group', `level-${level}`);
        selectedList.appendChild(levelHeader); // Append header to selected list
        selectedList.appendChild(levelSection); // Append level section to selected list
    }

    if (card.classList.contains('selected')) {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.textContent = spell.name;
        listItem.dataset.spellName = spell.name; // Store spell name in data attribute
        levelSection.appendChild(listItem);
    } else {
        const items = levelSection.querySelectorAll('.list-group-item');
        items.forEach(item => {
            if (item.dataset.spellName === spell.name) {
                levelSection.removeChild(item);
            }
        });

        // Remove the level section if no spells are left
        if (levelSection.children.length === 0) {
            selectedList.removeChild(levelSection.previousElementSibling); // Remove the header
            selectedList.removeChild(levelSection); // Remove the section itself
        }
    }

    // Sort the spells in the level section
    sortLevelSection(levelSection);
    
    // Sort level groups
    sortLevels(selectedList);
}

// Function to sort the spells in a level section
function sortLevelSection(levelSection) {
    const items = Array.from(levelSection.querySelectorAll('.list-group-item'));
    
    // Sort items alphabetically by text content
    items.sort((a, b) => a.textContent.localeCompare(b.textContent));

    // Clear the existing list and append sorted items
    levelSection.innerHTML = ''; // Clear existing items
    items.forEach(item => levelSection.appendChild(item)); // Append sorted items
}

// Function to sort level groups numerically
function sortLevels(selectedList) {
    const levelSections = Array.from(selectedList.querySelectorAll('ul.list-group'));

    // Sort level sections based on their level numbers
    levelSections.sort((a, b) => {
        const levelA = parseInt(a.className.match(/level-(\d+)/)[1]);
        const levelB = parseInt(b.className.match(/level-(\d+)/)[1]);
        return levelA - levelB;
    });

    // Clear the existing level sections
    selectedList.innerHTML = '';

    // Re-append sorted level sections and their headers
    levelSections.forEach(section => {
        const levelHeader = document.createElement('h3'); // Create new header for the level
        const levelNumber = section.className.match(/level-(\d+)/)[1]; // Extract the level number
        levelHeader.textContent = `Level ${levelNumber}`; // Set header text

        selectedList.appendChild(levelHeader); // Append header to selected list
        selectedList.appendChild(section); // Append section to selected list
    });
}


// Function to generate a PDF with fantasy font and title
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // Set font
    doc.setFont("times", "normal");

    // Set background color
    doc.setFillColor(250, 234, 210); // Light yellow-brownish tone
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F'); // Fill background

    // Add title at the top
    doc.setFontSize(30);
    doc.setTextColor(0, 0, 0); // Black text color
    doc.text('Spellbook', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    const levels = document.querySelectorAll('#selected-list h3');
    let yPosition = 25; // Starting position for text

    // Define colors similar to the website
    const headerColor = [176, 113, 19]; // Darker header background color
    const rowColor = [228, 212, 178]; // Darker background for rows
    const alternateRowColor = [211, 181, 143]; // Darker background for alternating rows

    levels.forEach((levelHeader, levelIndex) => {
        // Add level header background
        doc.setFillColor(...headerColor);
        doc.rect(10, yPosition, 190, 10, 'F'); // Header background

        // Add level header text
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255); // White text color
        doc.text(levelHeader.textContent, 12, yPosition + 7); // Adjusted position for centering
        yPosition += 12; // Move down after header

        const spells = levelHeader.nextElementSibling.querySelectorAll('.list-group-item');
        doc.setFontSize(12); // Smaller font for spells
        doc.setTextColor(0, 0, 0); // Black text color for spells

        spells.forEach((spell, index) => {
            // Draw row background color
            doc.setFillColor(...(index % 2 === 0 ? alternateRowColor : rowColor)); // Alternate colors
            doc.rect(10, yPosition, 190, 10, 'F'); // Row background

            // Add spell text
            doc.text(`- ${spell.textContent}`, 12, yPosition + 7); // Adjusted position for centering
            yPosition += 10; // Move down for the next spell
        });

        yPosition += 5; // Extra space between levels
    });

    doc.save('spellbook.pdf');
}


// Function to download selected class and spells as JSON
function downloadJSON() {
    const selectedClass = document.querySelector('#class-select').value; // Assuming you have a class select input
    const selectedSpells = [];
    
    const spells = document.querySelectorAll('.list-group-item');
    spells.forEach(spell => {
        level = spell.parentElement.previousElementSibling.innerHTML;
        level = parseInt(level.charAt(level.length-1));
        selectedSpells.push({"name": spell.textContent, "level": level})
    });

    const data = {
        class: selectedClass,
        spells: selectedSpells
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spells.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Function to handle JSON upload
function uploadJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        const spells = data["spells"];

        // Assuming you have a way to deselect all spells
        deselectAllSpells();
        document.getElementById("class-select").value = data["class"];

        update = ()=>{
            console.log(spells)
            spells.forEach(spell => {
            console.log(spell["name"]);
            const spellItem = Array.from(document.querySelectorAll('.card.mb-2')).find(item => item.querySelector(".card-title").textContent === spell["name"]);
                console.log(spellItem);
                toggleSpellSelection(spellItem, {"name":spell["name"]}, spell["level"])
            });

        };

        fetchSpells(data["class"], update);
    };
    reader.readAsText(file);
}

// Event listeners for buttons
document.getElementById('create-pdf').addEventListener('click', generatePDF);
document.getElementById('download-json').addEventListener('click', downloadJSON);
document.getElementById('upload-json').addEventListener('change', uploadJSON);


function deselectAllSpells() {
    document.getElementById('selected-list').innerHTML = "";
    document.querySelectorAll('.list-group-item.selected').forEach(item => {
        item.classList.remove('selected'); // Remove 'selected' class
    });
}