import { loadQuestions } from './csvReader.js';

// Declare the winners array globally
const winners = [];

async function loadConfig() {
    const response = await fetch('config.json');
    return response.json();
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("config-modal");
    const enableDoubles = document.getElementById("enable-doubles");
    const doubleConfig = document.getElementById("double-config");
    const startBtn = document.getElementById("start-game-btn");

    // Show/hide double config
    enableDoubles.addEventListener("change", () => {
        doubleConfig.style.display = enableDoubles.checked ? "block" : "none";
    });

    startBtn.addEventListener("click", () => {
        const config = {
            normalQuestionValue: parseInt(document.getElementById("normal-value").value, 10),
            k9DoubleQuestionValue: enableDoubles.checked ? parseInt(document.getElementById("double-value").value, 10) : null,
            enableDoubles: enableDoubles.checked
        };
        modal.style.display = "none";
        startApp(config); // Pass config to your main game logic
    });

    // Show modal on load
    modal.style.display = "flex";
});

// Example main game logic function
function startApp(config) {
    (async () => {
        const categoryRow = document.getElementById("category-row");
        const questionGrid = document.getElementById("question-grid");
        const winnersList = document.getElementById("winners-list");
        const overlay = document.createElement("div");
        const overlayContent = document.createElement("div");

        // Create the overlay element
        overlay.id = "question-overlay";
        overlay.classList.add("overlay", "hidden");
        overlayContent.id = "overlay-content";
        overlay.appendChild(overlayContent);
        document.body.appendChild(overlay);

        let currentSquare = null;

        // Load questions from the CSV file
        const questions = await loadQuestions("assets/questions.csv");

        if (config.enableDoubles) {
            // Assign K9 Double questions randomly
            const k9DoubleIndexes = [];
            while (k9DoubleIndexes.length < 2) {
                const idx = Math.floor(Math.random() * questions.length);
                if (!k9DoubleIndexes.includes(idx)) k9DoubleIndexes.push(idx);
            }
            questions.forEach((q, i) => {
                q.isK9Double = k9DoubleIndexes.includes(i);
            });
        } else {
            // No doubles: set all isK9Double to false
            questions.forEach(q => {
                q.isK9Double = false;
            });
        }

        // Log the questions array to the console
        console.log("Questions array:", questions);

        // Extract unique categories
        const categories = [...new Set(questions.map(q => q.category))];

        // Calculate the maximum number of questions per category
        const maxQuestionsPerCategory = Math.max(...categories.map(category => 
            questions.filter(q => q.category === category).length
        ));

        // Set up the category row and question grid
        categoryRow.style.display = "grid";
        categoryRow.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`;
        questionGrid.style.display = "grid";
        questionGrid.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`;
        
        // Set CSS custom property for number of rows
        document.documentElement.style.setProperty('--rows', maxQuestionsPerCategory);

        // Populate categories and questions
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

        for (let rowIndex = 0; rowIndex < maxQuestionsPerCategory; rowIndex++) {
            categories.forEach(category => {
                const square = document.createElement("div");
                square.classList.add("square");
                square.textContent = rowIndex + 1;

                const categoryQuestions = questions.filter(q => q.category === category);
                const question = categoryQuestions[rowIndex];

                if (question) {
                    square.dataset.category = category;
                    square.dataset.question = question.question;
                    square.dataset.answer = question.answer;

                    // Add click event listener for each square
                    square.addEventListener("click", (event) => {
                        if (
                            event.target.classList.contains("input-box") ||
                            event.target.classList.contains("save-button") ||
                            square.classList.contains("completed")
                        ) {
                            return;
                        }

                        currentSquare = square;

                        if (question.isK9Double) {
                            showK9DoubleOverlay(() => {
                                showOverlay(question.question, () => {
                                    showOverlay(question.answer, () => {
                                        overlay.classList.add("hidden");
                                        displayInputBox(square, question);
                                    });
                                });
                            });
                        } else {
                            showOverlay(question.question, () => {
                                showOverlay(question.answer, () => {
                                    overlay.classList.add("hidden");
                                    displayInputBox(square, question);
                                });
                            });
                        }
                    });

                    if (question.isK9Double) {
                        square.classList.add("k9-double");
                        square.dataset.k9Double = "true";
                    }
                } else {
                    // If no question exists for this position, make the square disabled
                    square.classList.add("disabled");
                    square.textContent = "";
                }

                questionGrid.appendChild(square);
            });
        }

        // Function to show the overlay with content
        function showOverlay(content, onClickCallback) {
            overlayContent.textContent = content;
            overlay.classList.remove("hidden");

            const handleClick = () => {
                overlay.removeEventListener("click", handleClick);
                if (onClickCallback) onClickCallback();
            };

            overlay.addEventListener("click", handleClick);
        }

        // Function to display the input box and save button
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
                    updateSquare(square, question, winnerName);
                    square.classList.remove("input-active");
                    square.classList.add("completed");

                    // Update the winners list
                    updateWinnersList(question, winnerName);
                }
            });
        }

        // Function to update the winners list
        function updateWinnersList(questionObj, winnerName) {
            const value = questionObj.isK9Double ? config.k9DoubleQuestionValue : config.normalQuestionValue;

            let winner = winners.find(w => w.winnerName === winnerName);

            if (winner) {
                winner.winnings.push(value);
            } else {
                winner = {
                    winnerName,
                    winnings: [value]
                };
                winners.push(winner);
            }

            winners.sort((a, b) => {
                const aTotal = a.winnings.reduce((sum, v) => sum + v, 0);
                const bTotal = b.winnings.reduce((sum, v) => sum + v, 0);
                return bTotal - aTotal;
            });

            winnersList.innerHTML = winners
                .map((winner, index) => {
                    const totalDollars = winner.winnings.reduce((sum, v) => sum + v, 0);
                    const formattedIndex = String(index + 1).padStart(2, '0');
                    const dots = '.'.repeat(20 - winner.winnerName.length);
                    return `<li>${formattedIndex}) ${winner.winnerName}${dots}$${totalDollars}</li>`;
                })
                .join("");
        }
    })();
}

// Function to generate and download the winners file
function downloadWinnersFile() {
    const winnersData = winners.map((winner, index) => {
        const totalDollars = winner.winnings.reduce((sum, v) => sum + v, 0);
        const formattedIndex = String(index + 1).padStart(2, '0');
        const dots = '.'.repeat(20 - winner.winnerName.length);
        return `${formattedIndex}) ${winner.winnerName}${dots}$${totalDollars}`;
    });

    // Build the content of the .txt file
    const fileContent = winnersData.join("\n");

    // Generate the filename with the current date in MM-DD-YYYY format
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(currentDate.getDate()).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${month}-${day}-${year}`; // Format as MM-DD-YYYY
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

// Function to show the K9 Double overlay
function showK9DoubleOverlay(callback) {
    const k9Overlay = document.getElementById("k9-double-overlay");
    popKnineLogos();
    k9Overlay.classList.remove("hidden");
    k9Overlay.onclick = function() {
        k9Overlay.onclick = null;
        // Show the question overlay FIRST
        if (callback) callback();
        // Then hide the K9 overlay immediately after
        k9Overlay.classList.add("hidden");
    };
}

// Function to pop K9 logos
function popKnineLogos() {
    const logoContainer = document.getElementById('k9-double-logos');
    logoContainer.innerHTML = '';
    const logoCount = 20; // Number of logos to pop

    // Central safe zone: 35% from left/top, 30% wide/tall (so 35%-65%)
    const safeZone = { x: 35, y: 35, w: 30, h: 30 }; // percent of width/height

    for (let i = 0; i < logoCount; i++) {
        const logo = document.createElement('div');
        logo.className = 'k9-double-logo';

        let x, y;
        // Only allow positions OUTSIDE the safe zone
        do {
            x = Math.random() * 100;
            y = Math.random() * 100;
        } while (
            x > safeZone.x && x < (safeZone.x + safeZone.w) &&
            y > safeZone.y && y < (safeZone.y + safeZone.h)
        );

        logo.style.left = `calc(${x}% - 40px)`; // 40px = half logo width
        logo.style.top = `calc(${y}% - 40px)`;

        // Stagger the animation
        logo.style.animationDelay = `${Math.random() * 1.2}s`;

        logoContainer.appendChild(logo);
    }
}

// Function to update the square display
function updateSquare(square, question, enteredValue) {
    const isK9Double = question.isK9Double;

    square.innerHTML = `
        <div class="completed-content">
            ${isK9Double ? `<div class="k9-double-label">K9 DOUBLE</div>` : ""}
            <div class="completed-answer">${question.answer}</div>
            <div class="completed-winner">${enteredValue}</div>
        </div>
    `;
    square.classList.add("completed");
}