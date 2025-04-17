import { loadQuestions } from './csvReader.js';

// Declare the winners array globally
const winners = [];

document.addEventListener("DOMContentLoaded", async () => {
    const categoryRow = document.getElementById("category-row");
    const questionGrid = document.getElementById("question-grid");
    const winnersList = document.getElementById("winners-list"); // Reference to the winners list

    // Load questions from the CSV file
    const questions = await loadQuestions("assets/questions.csv");
    console.log("Loaded questions:", questions);

    // Extract unique categories
    const categories = [...new Set(questions.map(q => q.Category))];

    // Set the grid layout for the category row
    categoryRow.style.display = "grid";
    categoryRow.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`; // Number of columns = number of categories
    categoryRow.style.gap = "5px"; // Add spacing between categories

    // Set the grid layout for the question grid
    questionGrid.style.display = "grid";
    questionGrid.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`; // Number of columns = number of categories
    questionGrid.style.gap = "5px"; // Add spacing between squares

    // Create the category headers
    categories.forEach(category => {
        const categoryCell = document.createElement("div");
        categoryCell.classList.add("category-cell");
        categoryCell.textContent = category; // Set the category text
        categoryRow.appendChild(categoryCell);
    });

    // Create the question squares
    for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
        categories.forEach(category => {
            const square = document.createElement("div");
            square.classList.add("square");

            // Display the question number (1, 2, 3, 4, 5)
            square.textContent = rowIndex + 1;

            // Find the question for the current category and row
            const categoryQuestions = questions.filter(q => q.Category === category);
            const question = categoryQuestions[rowIndex];

            if (question) {
                // Attach question data to the square
                square.dataset.category = category;
                square.dataset.question = question.Question;
                square.dataset.answer = question.Answer;

                // Add click event listener for each square
                square.addEventListener("click", () => {
                    if (square.textContent === `${rowIndex + 1}`) {
                        // Show the question
                        square.textContent = question.Question;
                        square.classList.add("question-displayed");
                    } else if (square.textContent === question.Question) {
                        // Show the answer
                        square.textContent = question.Answer;
                        square.classList.remove("question-displayed");
                        square.classList.add("answer-displayed");
                    } else if (square.textContent === question.Answer) {
                        // Display the input box and save button
                        displayInputBox(square, category, question);
                    }
                });
            }

            questionGrid.appendChild(square);
        });
    }

    // Function to display the input box and save button
    function displayInputBox(square, category, question, currentWinner = "") {
        setTimeout(() => {
            const inputContainer = document.createElement("div");
            inputContainer.classList.add("input-container");

            const inputBox = document.createElement("input");
            inputBox.type = "text";
            inputBox.placeholder = "Enter winner's name";
            inputBox.value = currentWinner;
            inputBox.classList.add("input-box");

            const saveButton = document.createElement("button");
            saveButton.classList.add("save-button");

            inputContainer.appendChild(inputBox);
            inputContainer.appendChild(saveButton);

            square.innerHTML = "";
            square.appendChild(inputContainer);
            square.classList.add("input-active");

            saveButton.addEventListener("click", async () => {
                const enteredValue = inputBox.value.trim();
                if (enteredValue) {
                    square.innerHTML = `
                        <div>${question.Question}</div>
                        <div style="font-weight: bold;">${question.Answer}</div>
                        <div style="font-style: italic;">${enteredValue}</div>
                    `;
                    square.classList.remove("input-active");
                    square.classList.add("completed");

                    // Add or update the winner in the global winners array
                    const existingWinnerIndex = winners.findIndex(w => w.question === question.Question);
                    if (existingWinnerIndex !== -1) {
                        // Update the existing winner
                        winners[existingWinnerIndex].winnerName = enteredValue;
                    } else {
                        // Add a new winner
                        winners.push({ question: question.Question, winnerName: enteredValue });
                    }

                    // Update the winners section
                    updateWinnersSection(winners.map(w => w.winnerName));

                    // Save the winner to the server
                    await saveWinnerToServer(category, question.Question, question.Answer, enteredValue);
                }
            });
        }, 0);
    }

    // Function to update the winners section
    function updateWinnersSection(winners) {
        winnersList.innerHTML = ""; // Clear the current list

        // Calculate the total wins for each winner
        const winnerCounts = winners.reduce((counts, winner) => {
            if (counts[winner]) {
                counts[winner] += 1;
            } else {
                counts[winner] = 1;
            }
            return counts;
        }, {});

        // Sort winners by their counts in descending order
        const sortedWinners = Object.entries(winnerCounts).sort((a, b) => b[1] - a[1]);

        // Display the winners and their win counts
        sortedWinners.forEach(([winnerName, winCount], index) => {
            // Format the list item
            const listItem = document.createElement("li");
            listItem.textContent = `${index + 1}. ${winnerName}.....${winCount}`;
            winnersList.appendChild(listItem);

            // Add a horizontal line after each winner
            const hr = document.createElement("hr");
            winnersList.appendChild(hr);
        });
    }
});

// Function to save winners to a file
/*function saveWinnersToFile(winners) {
    // Create a Map to track winners by question
    const winnerMap = new Map();

    // Populate the Map with the latest winner for each question
    winners.forEach(winner => {
        const { question, winnerName } = winner;
        winnerMap.set(question, winnerName);
    });

    // Create a string representation of the winners
    const winnersText = Array.from(winnerMap.entries())
        .map(([question, winnerName]) => `${question},${winnerName}`)
        .join("\n");

    // Create a Blob and download it
    const blob = new Blob([winnersText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "winners.txt";
    link.click();
}*/

// Function to save winner to the server
async function saveWinnerToServer(category, question, answer, winnerName) {
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
}

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