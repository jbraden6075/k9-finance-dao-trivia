import { loadQuestions } from './csvReader.js';

// Declare the winners array globally
const winners = [];

document.addEventListener("DOMContentLoaded", async () => {
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
    console.log("Loaded questions:", questions);

    // Extract unique categories
    const categories = [...new Set(questions.map(q => q.Category))];

    // Set up the category row and question grid
    categoryRow.style.display = "grid";
    categoryRow.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`;
    questionGrid.style.display = "grid";
    questionGrid.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`;

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

    for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
        categories.forEach(category => {
            const square = document.createElement("div");
            square.classList.add("square");
            square.textContent = rowIndex + 1;

            const categoryQuestions = questions.filter(q => q.Category === category);
            const question = categoryQuestions[rowIndex];

            if (question) {
                square.dataset.category = category;
                square.dataset.question = question.Question;
                square.dataset.answer = question.Answer;

                // Add click event listener for each square
                square.addEventListener("click", (event) => {
                    // Prevent overlay from displaying if clicking inside input box, save button, or completed square
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
                square.innerHTML = `
                    <div>${question.Question}</div>
                    <div style="font-weight: bold;">${question.Answer}</div>
                    <div style="font-style: italic;">${winnerName}</div>
                `;
                square.classList.remove("input-active");
                square.classList.add("completed");

                // Update the winners list
                updateWinnersList(question.Question, winnerName);
            }
        });
    }

    // Function to update the winners list
    function updateWinnersList(question, winnerName) {
        // Check if the winner already exists in the winners array
        const winnerIndex = winners.findIndex(w => w.winnerName === winnerName);

        if (winnerIndex !== -1) {
            // If the winner already exists, increment their win count
            winners[winnerIndex].winCount += 1;
        } else {
            // If the winner is new, add them to the winners array
            winners.push({ question, winnerName, winCount: 1 });
        }

        // Sort the winners array by win count in descending order
        winners.sort((a, b) => b.winCount - a.winCount);

        // Update the winners list in the DOM
        winnersList.innerHTML = winners
            .map((winner, index) => {
                const formattedIndex = (index + 1).toString().padStart(2, '0'); // Add leading zero to the index
                return `<li>${formattedIndex}. ${winner.winnerName}.....${winner.winCount}</li>`;
            })
            .join("");
    }
});

// Function to save winner to the server
/*async function saveWinnerToServer(category, question, answer, winnerName) {
    try {
        const response = await fetch('/saveWinner', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category, question, answer, winnerName }),
        });

        if (!response.ok) {
            throw new Error(`Failed to save winner: ${response.statusText}`);
        }

        console.log('Winner saved successfully to the server.');
    } catch (error) {
        console.error('Error saving winner to the server:', error);
    }
}*/

// Function to generate and download the winners file
function downloadWinnersFile() {
    // Get the winners list from the DOM
    const winnersList = document.querySelectorAll("#winners-list li");

    // Map the winners list to an array of formatted strings
    const winnersData = Array.from(winnersList).map((li, index) => {
        // Extract the winner's name and win count from the text content
        const textParts = li.textContent.split(".....");
        const winnerName = textParts[0].replace(/^\d+\.\s*/, "").trim(); // Remove the leading index and trim spaces
        const winCount = textParts[1]?.trim() || "0"; // Default to "0" if win count is missing

        // Add a leading zero to the index if it's less than 10
        const formattedIndex = (index + 1).toString().padStart(2, '0');

        // Calculate the number of dots needed for alignment
        const maxLineLength = 35; // Adjust this value to reduce the total line length
        const dotsLength = maxLineLength - (formattedIndex.length + 2 + winnerName.length + winCount.length); // 2 accounts for ". "
        const dots = '.'.repeat(Math.max(dotsLength, 3)); // Ensure at least 3 dots

        return `${formattedIndex}. ${winnerName}${dots}${winCount}`;
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