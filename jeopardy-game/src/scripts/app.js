import { loadQuestions } from './csvReader.js';

// Global state
const winners = [];
let currentSquare = null;
let overlay = null;
let k9DoubleOverlay = null;

// DOM elements
const elements = {
    modal: null,
    enableDoubles: null,
    doubleConfig: null,
    startBtn: null,
    categoryRow: null,
    questionGrid: null,
    downloadBtn: null
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", initializeApp);

/**
 * Sets up initial DOM references and event listeners
 */
function initializeApp() {
    cacheElements();
    setupEventListeners();
    showConfigModal();
}

/**
 * Cache frequently used DOM elements
 */
function cacheElements() {
    elements.modal = document.getElementById("config-modal");
    elements.enableDoubles = document.getElementById("enable-doubles");
    elements.doubleConfig = document.getElementById("double-config");
    elements.startBtn = document.getElementById("start-game-btn");
    elements.categoryRow = document.getElementById("category-row");
    elements.questionGrid = document.getElementById("question-grid");
    elements.downloadBtn = document.getElementById("download-winners");
    
    overlay = document.getElementById("question-overlay");
    k9DoubleOverlay = document.getElementById("k9-double-overlay");
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    elements.enableDoubles.addEventListener("change", toggleDoubleConfig);
    elements.startBtn.addEventListener("click", handleStartGame);
    elements.downloadBtn.addEventListener("click", downloadWinnersFile);
}

/**
 * Show/hide double configuration based on checkbox
 */
function toggleDoubleConfig() {
    const isEnabled = elements.enableDoubles.checked;
    elements.doubleConfig.style.display = isEnabled ? "block" : "none";
}

/**
 * Handle start game button click
 */
function handleStartGame() {
    const config = getGameConfig();
    elements.modal.style.display = "none";
    startGame(config);
}

/**
 * Get current game configuration
 * @returns {Object} Game configuration
 */
function getGameConfig() {
    return {
        enableDoubles: elements.enableDoubles.checked,
        doubleValue: parseInt(document.getElementById("double-value").value, 10)
    };
}

/**
 * Show the configuration modal
 */
function showConfigModal() {
    elements.modal.style.display = "flex";
}

/**
 * Start the main game with given configuration
 * @param {Object} config - Game configuration
 */
async function startGame(config) {
    try {
        // Remove 'src/' prefix since server serves from src directory
        const questions = await loadQuestions('assets/questions.csv');
        
        if (questions.length === 0) {
            console.error("No questions loaded");
            return;
        }
        
        const gameData = prepareGameData(questions, config);
        setupGameBoard(gameData);
        
        console.log("Game started with configuration:", config);
        console.log("Questions loaded:", questions.length);
    } catch (error) {
        console.error("Error starting game:", error);
    }
}

/**
 * Prepare game data with K9 doubles if enabled
 * @param {Array} questions - Array of question objects
 * @param {Object} config - Game configuration
 * @returns {Object} Prepared game data
 */
function prepareGameData(questions, config) {
    let processedQuestions = [...questions];
    const k9DoubleIndexes = [];
    
    if (config.enableDoubles) {
        k9DoubleIndexes.push(...generateK9DoubleIndexes(questions.length, config.doubleValue));
        processedQuestions = markK9Doubles(processedQuestions, k9DoubleIndexes);
    }
    
    return {
        questions: processedQuestions,
        k9DoubleIndexes,
        categories: extractUniqueCategories(processedQuestions)
    };
}

/**
 * Generate random indexes for K9 doubles
 * @param {number} totalQuestions - Total number of questions
 * @param {number} doubleCount - Number of doubles to generate
 * @returns {Array} Array of K9 double indexes
 */
function generateK9DoubleIndexes(totalQuestions, doubleCount) {
    const indexes = [];
    
    while (indexes.length < doubleCount) {
        const randomIndex = Math.floor(Math.random() * totalQuestions);
        
        if (!indexes.includes(randomIndex)) {
            indexes.push(randomIndex);
        }
    }
    
    return indexes;
}

/**
 * Mark questions as K9 doubles
 * @param {Array} questions - Array of questions
 * @param {Array} indexes - Indexes to mark as doubles
 * @returns {Array} Questions with K9 double flags
 */
function markK9Doubles(questions, indexes) {
    return questions.map((question, index) => ({
        ...question,
        isK9Double: indexes.includes(index)
    }));
}

/**
 * Extract unique categories from questions
 * @param {Array} questions - Array of questions
 * @returns {Array} Array of unique categories
 */
function extractUniqueCategories(questions) {
    return [...new Set(questions.map(q => q.category))];
}

/**
 * Set up the game board with categories and questions
 * @param {Object} gameData - Prepared game data
 */
function setupGameBoard(gameData) {
    const { questions, categories } = gameData;
    
    const maxQuestionsPerCategory = calculateMaxQuestionsPerCategory(questions, categories);
    
    setupGridLayout(categories, maxQuestionsPerCategory);
    createCategoryHeaders(categories);
    createQuestionSquares(questions, categories, maxQuestionsPerCategory);
}

/**
 * Calculate maximum questions per category
 * @param {Array} questions - Array of questions
 * @param {Array} categories - Array of categories
 * @returns {number} Maximum questions per category
 */
function calculateMaxQuestionsPerCategory(questions, categories) {
    return Math.max(
        ...categories.map(category => 
            questions.filter(q => q.category === category).length
        )
    );
}

/**
 * Set up CSS grid layout
 * @param {Array} categories - Array of categories
 * @param {number} maxRows - Maximum number of rows
 */
function setupGridLayout(categories, maxRows) {
    const gridTemplate = `repeat(${categories.length}, 1fr)`;
    
    elements.categoryRow.style.gridTemplateColumns = gridTemplate;
    elements.questionGrid.style.gridTemplateColumns = gridTemplate;
    
    document.documentElement.style.setProperty('--rows', maxRows);
}

/**
 * Create category header elements
 * @param {Array} categories - Array of categories
 */
function createCategoryHeaders(categories) {
    categories.forEach(category => {
        const categoryCell = createCategoryCell(category);
        elements.categoryRow.appendChild(categoryCell);
    });
}

/**
 * Create a single category cell
 * @param {string} category - Category name
 * @returns {HTMLElement} Category cell element
 */
function createCategoryCell(category) {
    const cell = document.createElement("div");
    cell.classList.add("category-cell");
    
    const displayName = category.replace(/_/g, ' ');
    cell.textContent = displayName;
    
    if (displayName.includes(' ')) {
        cell.classList.add('multi-word');
    }
    
    return cell;
}

/**
 * Create question square elements
 * @param {Array} questions - Array of questions
 * @param {Array} categories - Array of categories
 * @param {number} maxRows - Maximum number of rows
 */
function createQuestionSquares(questions, categories, maxRows) {
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        categories.forEach(category => {
            const square = createQuestionSquare(questions, category, rowIndex);
            elements.questionGrid.appendChild(square);
        });
    }
}

/**
 * Create a single question square
 * @param {Array} questions - Array of questions
 * @param {string} category - Category name
 * @param {number} rowIndex - Row index
 * @returns {HTMLElement} Question square element
 */
function createQuestionSquare(questions, category, rowIndex) {
    const square = document.createElement("div");
    square.classList.add("square");
    
    const categoryQuestions = questions.filter(q => q.category === category);
    const question = categoryQuestions[rowIndex];
    
    if (question) {
        setupQuestionSquare(square, question, rowIndex);
    } else {
        setupEmptySquare(square);
    }
    
    return square;
}

/**
 * Set up a question square with data and event listener
 * @param {HTMLElement} square - Square element
 * @param {Object} question - Question data
 * @param {number} rowIndex - Row index
 */
function setupQuestionSquare(square, question, rowIndex) {
    square.textContent = rowIndex + 1;
    square.dataset.category = question.category;
    square.dataset.question = question.question;
    square.dataset.answer = question.answer;
    
    if (question.isK9Double) {
        square.dataset.isK9Double = "true";
    }
    
    square.addEventListener("click", () => handleSquareClick(square, question));
}

/**
 * Set up an empty square (no question available)
 * @param {HTMLElement} square - Square element
 */
function setupEmptySquare(square) {
    square.classList.add("disabled");
    square.textContent = "";
}

/**
 * Handle question square click
 * @param {HTMLElement} square - Clicked square
 * @param {Object} question - Question data
 */
function handleSquareClick(square, question) {
    currentSquare = square;
    
    if (question.isK9Double) {
        showK9DoubleSequence(question);
    } else {
        showQuestionSequence(question);
    }
}

/**
 * Show K9 double sequence (overlay -> question -> answer -> input)
 * @param {Object} question - Question data
 */
function showK9DoubleSequence(question) {
    showK9DoubleOverlay(() => {
        showOverlay(question.question, () => {
            showOverlay(question.answer, () => {
                hideOverlay();
                showInputBox(currentSquare, question);
            });
        });
    });
}

/**
 * Show regular question sequence (question -> answer -> input)
 * @param {Object} question - Question data
 */
function showQuestionSequence(question) {
    showOverlay(question.question, () => {
        showOverlay(question.answer, () => {
            hideOverlay();
            showInputBox(currentSquare, question);
        });
    });
}

/**
 * Show the K9 double overlay
 * @param {Function} callback - Callback to execute after overlay
 */
function showK9DoubleOverlay(callback) {
    k9DoubleOverlay.classList.remove("hidden");
    
    setTimeout(() => {
        popK9Logos();
    }, 500);
    
    k9DoubleOverlay.onclick = () => {
        k9DoubleOverlay.classList.add("hidden");
        k9DoubleOverlay.onclick = null;
        callback();
    };
}

/**
 * Animate K9 logos with pop effect
 */
function popK9Logos() {
    const logos = document.querySelectorAll('.k9-double-logo');
    
    logos.forEach((logo, index) => {
        setTimeout(() => {
            logo.style.animationDelay = `${index * 0.2}s`;
        }, index * 200);
    });
}

/**
 * Show overlay with content and click handler
 * @param {string} content - Content to display
 * @param {Function} callback - Callback for click
 */
function showOverlay(content, callback) {
    const overlayContent = document.getElementById("overlay-content");
    overlayContent.textContent = content;
    
    overlay.classList.remove("hidden");
    overlay.onclick = callback;
}

/**
 * Hide the main overlay
 */
function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.onclick = null;
}

/**
 * Show input box for winner entry
 * @param {HTMLElement} square - Question square
 * @param {Object} question - Question data
 */
function showInputBox(square, question) {
    // Remove any existing click handlers from the square
    square.removeEventListener("click", handleSquareClick);
    
    const inputContainer = createInputContainer();
    
    square.innerHTML = "";
    square.appendChild(inputContainer);
    square.classList.add("input-active");
    
    // Don't clone - just update the currentSquare reference
    currentSquare = square;
    
    const input = inputContainer.querySelector('input[type="text"]');
    input.focus();
    
    // Re-setup the handlers on the new elements
    const saveButton = inputContainer.querySelector('.save-button');
    setupInputHandlers(input, saveButton);
}

/**
 * Set up input field and save button event handlers
 * @param {HTMLElement} input - Input field
 * @param {HTMLElement} saveButton - Save button
 */
function setupInputHandlers(input, saveButton) {
    const handleSave = (event) => {
        // Prevent event bubbling to avoid triggering the square's click event
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        const enteredValue = input.value.trim();
        
        if (enteredValue) {
            saveWinner(enteredValue);
            updateSquareDisplay(currentSquare, {
                question: currentSquare.dataset.question,
                answer: currentSquare.dataset.answer,
                isK9Double: currentSquare.dataset.isK9Double === "true"
            }, enteredValue);
        }
    };
    
    // Remove any existing listeners first
    saveButton.removeEventListener("click", handleSave);
    input.removeEventListener("keypress", handleSave);
    
    // Add the event listeners
    saveButton.addEventListener("click", handleSave);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.stopPropagation();
            e.preventDefault();
            handleSave(e);
        }
    });
}

/**
 * Create input container with input field and save button
 * @returns {HTMLElement} Input container element
 */
function createInputContainer() {
    const container = document.createElement("div");
    container.classList.add("input-container");
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter winner's name";
    
    // Create image instead of button
    const saveButton = document.createElement("img");
    saveButton.src = "assets/KNINE.svg";
    saveButton.alt = "Save";
    saveButton.title = "Save Winner";
    saveButton.classList.add("save-button");
    
    // Don't setup handlers here - do it in showInputBox after elements are in DOM
    
    container.appendChild(input);
    container.appendChild(saveButton);
    
    return container;
}

/**
 * Save winner to the winners list
 * @param {string} winnerName - Name of the winner
 */
function saveWinner(winnerName) {
    const category = currentSquare.dataset.category;
    const question = currentSquare.dataset.question;
    const answer = currentSquare.dataset.answer;
    const isK9Double = currentSquare.dataset.isK9Double === "true";
    
    const winnerEntry = {
        name: winnerName,
        category,
        question,
        answer,
        isK9Double
    };
    
    winners.push(winnerEntry);
    updateWinnersList();
    
    console.log("Winner saved:", winnerEntry);
}

/**
 * Update the winners list display
 */
function updateWinnersList() {
    const winnersList = document.getElementById("winners-list");
    
    // Calculate total winnings per person
    const winnerTotals = {};
    
    winners.forEach(winner => {
        const pointValue = winner.isK9Double ? 50 : 25;
        
        if (winnerTotals[winner.name]) {
            winnerTotals[winner.name] += pointValue;
        } else {
            winnerTotals[winner.name] = pointValue;
        }
    });
    
    // Convert to array and sort by total winnings (highest first)
    const sortedWinners = Object.entries(winnerTotals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);
    
    winnersList.innerHTML = sortedWinners
        .map((winner, index) => {
            // Create dots to fill space between name and value
            const nameLength = winner.name.length;
            const totalWidth = 25; // Adjust this number based on your design needs
            const dotsCount = Math.max(1, totalWidth - nameLength - 4); // -4 for the dollar amount
            const dots = ".".repeat(dotsCount);
            
            return `<li>${index + 1}. ${winner.name}${dots}$${winner.total}</li>`;
        })
        .join("");
}

/**
 * Update square display after completion
 * @param {HTMLElement} square - Question square
 * @param {Object} question - Question data
 * @param {string} winnerName - Winner's name
 */
function updateSquareDisplay(square, question, winnerName) {
    const content = createCompletedContent(question, winnerName);
    
    square.innerHTML = "";
    square.appendChild(content);
    square.classList.remove("input-active");
    square.classList.add("completed");
}

/**
 * Create completed square content
 * @param {Object} question - Question data
 * @param {string} winnerName - Winner's name
 * @returns {HTMLElement} Completed content element
 */
function createCompletedContent(question, winnerName) {
    const container = document.createElement("div");
    container.classList.add("completed-content");
    
    if (question.isK9Double) {
        const k9Label = document.createElement("div");
        k9Label.classList.add("k9-double-label");
        k9Label.textContent = "K9 DOUBLE";
        container.appendChild(k9Label);
    }
    
    const answerDiv = document.createElement("div");
    answerDiv.classList.add("completed-answer");
    answerDiv.textContent = question.answer;
    container.appendChild(answerDiv);
    
    const winnerDiv = document.createElement("div");
    winnerDiv.classList.add("completed-winner");
    winnerDiv.textContent = winnerName;
    container.appendChild(winnerDiv);
    
    return container;
}

/**
 * Generate and download winners file
 */
function downloadWinnersFile() {
    if (winners.length === 0) {
        alert("No winners to download yet!");
        return;
    }
    
    const fileContent = generateWinnersFileContent();
    const fileName = generateFileName();
    
    downloadFile(fileContent, fileName);
}

/**
 * Generate winners file content
 * @returns {string} File content
 */
function generateWinnersFileContent() {
    const header = "K9 Finance DAO Trivia Winners\n" + "=".repeat(30) + "\n\n";
    
    // Calculate total winnings per person (same logic as updateWinnersList)
    const winnerTotals = {};
    
    winners.forEach(winner => {
        const pointValue = winner.isK9Double ? 50 : 25;
        
        if (winnerTotals[winner.name]) {
            winnerTotals[winner.name] += pointValue;
        } else {
            winnerTotals[winner.name] = pointValue;
        }
    });
    
    // Convert to array and sort by total winnings (highest first)
    const sortedWinners = Object.entries(winnerTotals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);
    
    // Format winners content with dots and dollar amounts
    const winnersContent = sortedWinners
        .map((winner, index) => {
            // Create dots to fill space between name and value
            const nameLength = winner.name.length;
            const totalWidth = 30; // Slightly wider for file format
            const dotsCount = Math.max(1, totalWidth - nameLength - 4); // -4 for the dollar amount
            const dots = ".".repeat(dotsCount);
            
            return `${index + 1}. ${winner.name}${dots}$${winner.total}`;
        })
        .join("\n");
    
    return header + winnersContent;
}

/**
 * Generate filename with current date
 * @returns {string} Generated filename
 */
function generateFileName() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `K9 Finance DAO Trivia Winners - ${month}-${day}-${year}.txt`;
}

/**
 * Download file with given content and filename
 * @param {string} content - File content
 * @param {string} filename - File name
 */
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
}