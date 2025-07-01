import { loadQuestions } from './csvReader.js';

// Declare the winners array globally
const winners = [];

let currentRound = 1;
let allQuestions = [];
let allCategories = [];

let currentSquare = null;
let overlay, overlayContent;
let winnersList;
const completedSquares = new Map(); // key: `${round}_${category}_${question}`, value: {winnerName}

document.addEventListener("DOMContentLoaded", async () => {
    const categoryRow = document.getElementById("category-row");
    const questionGrid = document.getElementById("question-grid");

    // Overlay setup (assumes overlay exists in HTML)
    overlay = document.getElementById("overlay");
    overlayContent = document.getElementById("overlay-content");

    // Load questions from the CSV file
    allQuestions = await loadQuestions("assets/questions.csv");
    // Extract all unique categories
    allCategories = [...new Set(allQuestions.map(q => q.Category))];

    renderBoard(currentRound);

    // Add event listener for Round buttons
    document.getElementById("round1-btn").addEventListener("click", () => {
        currentRound = 1;
        renderBoard(currentRound);
    });
    document.getElementById("round2-btn").addEventListener("click", () => {
        currentRound = 2;
        renderBoard(currentRound);
    });
    document.getElementById("round3-btn").addEventListener("click", () => {
        currentRound = 3;
        renderBoard(currentRound);
    });

    winnersList = document.getElementById("winners-list");
});

// --- Place these at the top level, not inside DOMContentLoaded ---

function showOverlay(content, onClickCallback) {
    const overlay = document.getElementById("overlay");
    const overlayContent = document.getElementById("overlay-content");
    overlayContent.textContent = content;
    overlay.classList.remove("hidden");

    const handleClick = () => {
        overlay.removeEventListener("click", handleClick);
        if (onClickCallback) onClickCallback();
        else overlay.classList.add("hidden");
    };

    overlay.addEventListener("click", handleClick);
}

function displayInputBox(square, question) {
    square.innerHTML = `
        <div class="input-container">
            <input type="text" class="input-box" placeholder="Enter winner's name">
            <button class="save-button"></button>
        </div>
    `;
    square.classList.add("input-active");

    const saveButton = square.querySelector(".save-button");
    const inputBox = square.querySelector(".input-box");

    saveButton.addEventListener("click", () => {
        const winnerName = inputBox.value.trim();
        if (winnerName) {
            // Persist completed state
            const key = `${currentRound}_${square.dataset.category}_${square.dataset.question}`;
            completedSquares.set(key, { winnerName });

            square.innerHTML = `
                <div>${square.dataset.question}</div>
                <div style="font-weight: bold;">${square.dataset.answer}</div>
                <div style="font-style: italic;">${winnerName}</div>
            `;
            square.classList.remove("input-active");
            square.classList.add("completed");

            // Update the winners list
            updateWinnersList(square.dataset.question, winnerName);
        }
    });
}

// Function to update the winners list
function updateWinnersList(question, winnerName) {
    // Find the winner in the array
    let winner = winners.find(w => w.winnerName === winnerName);

    if (winner) {
        winner.rounds = winner.rounds || {};
        winner.rounds[currentRound] = (winner.rounds[currentRound] || 0) + 1;
    } else {
        winner = {
            winnerName,
            rounds: { [currentRound]: 1 }
        };
        winners.push(winner);
    }

    // Sort winners by total dollar amount descending
    winners.sort((a, b) => {
        const aTotal = (a.rounds[1] || 0) * 15 + (a.rounds[2] || 0) * 25 + (a.rounds[3] || 0) * 100;
        const bTotal = (b.rounds[1] || 0) * 15 + (b.rounds[2] || 0) * 25 + (b.rounds[3] || 0) * 100;
        return bTotal - aTotal;
    });

    // Calculate the max length for padding (after all winners are added)
    const maxNameLength = Math.max(...winners.map(w => w.winnerName.length));
    const padLength = maxNameLength + 6; // 6 extra for dots

    winnersList.innerHTML = winners
        .map((winner, index) => {
            const r1 = winner.rounds[1] || 0;
            const r2 = winner.rounds[2] || 0;
            const r3 = winner.rounds[3] || 0;
            const totalDollars = (r1 * 15) + (r2 * 25) + (r3 * 100);
            // Pad with dots to align the dollar amounts
            const paddedName = (winner.winnerName + '......').padEnd(padLength, '.');
            return `<li>${index + 1}) ${paddedName}$${totalDollars}</li>`;
        })
        .join("");
}

function renderBoard(round) {
    const categoryRow = document.getElementById("category-row");
    const questionGrid = document.getElementById("question-grid");

    // Clear previous board
    categoryRow.innerHTML = "";
    questionGrid.innerHTML = "";

    // Get categories for this round (2 per round)
    const categories = allCategories.slice((round - 1) * 2, round * 2);

    // Set up the category row and question grid
    categoryRow.style.display = "grid";
    categoryRow.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`;
    questionGrid.style.display = "grid";
    questionGrid.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`;

    // Populate categories
    categories.forEach(category => {
        const categoryCell = document.createElement("div");
        categoryCell.classList.add("category-cell");
        const displayName = category.replace(/_/g, ' ');
        categoryCell.textContent = displayName;
        if (displayName.includes(' ')) {
            categoryCell.classList.add('multi-word');
        }
        categoryRow.appendChild(categoryCell);
    });

    // Determine number of questions per category for this round
    const numQuestions = (round === 3) ? 1 : 5;

    // Populate questions
    for (let rowIndex = 0; rowIndex < numQuestions; rowIndex++) {
        categories.forEach(category => {
            const square = document.createElement("div");
            square.classList.add("square");
            if (round === 3) {
                square.classList.add("final-round-square");
            }
            square.textContent = rowIndex + 1;

            const categoryQuestions = allQuestions.filter(q => q.Category === category);
            const question = categoryQuestions[rowIndex];

            if (question) {
                square.dataset.category = category;
                square.dataset.question = question.Question;
                square.dataset.answer = question.Answer;

                // Check if this square is completed
                const key = `${round}_${category}_${question.Question}`;
                const completed = completedSquares.get(key);
                if (completed) {
                    square.innerHTML = `
                        <div>${question.Question}</div>
                        <div style="font-weight: bold;">${question.Answer}</div>
                        <div style="font-style: italic;">${completed.winnerName}</div>
                    `;
                    square.classList.add("completed");
                } else {
                    square.addEventListener("click", (event) => {
                        if (
                            event.target.classList.contains("input-box") ||
                            event.target.classList.contains("save-button") ||
                            square.classList.contains("completed")
                        ) {
                            return;
                        }

                        currentSquare = square;
                        showOverlay(question.Question, () => {
                            showOverlay(question.Answer, () => {
                                overlay.classList.add("hidden");
                                displayInputBox(square, question);
                            });
                        });
                    });
                }
            }

            questionGrid.appendChild(square);
        });
    }

    if (currentRound === 3) {
        categoryRow.classList.add("final-round");
    } else {
        categoryRow.classList.remove("final-round");
    }
}

// Function to generate and download the winners file
function downloadWinnersFile() {
    // Calculate the max length for padding
    const maxNameLength = Math.max(...winners.map(w => w.winnerName.length));
    const padLength = maxNameLength + 6; // 6 extra for dots

    const winnersData = winners.map((winner, index) => {
        const r1 = winner.rounds[1] || 0;
        const r2 = winner.rounds[2] || 0;
        const r3 = winner.rounds[3] || 0;
        const totalDollars = (r1 * 15) + (r2 * 25) + (r3 * 100);
        const paddedName = (winner.winnerName + '......').padEnd(padLength, '.');
        return `${index + 1}) ${paddedName}$${totalDollars}`;
    });

    // Build the content of the .txt file
    const fileContent = winnersData.join("\n");

    // Generate the filename with the current date in MM-DD-YYYY format
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${month}-${day}-${year}`;
    const fileName = `K9 Finance DAO Trivia Winners - ${formattedDate}.txt`;

    // Create a Blob and download it
    const blob = new Blob([fileContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

// Attach the event listener to the button
document.getElementById("download-winners").addEventListener("click", downloadWinnersFile);
