const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(express.json());

// Serve static files (e.g., CSS, JS, images) from the "src" folder
app.use(express.static(path.join(__dirname, "src")));

// Serve the index.html file for the root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "src", "index.html"));
});

// Path to the winners.csv file
const winnersFilePath = path.join(__dirname, "src", "assets", "winners.csv");

// Endpoint to update winners.csv
app.post("/update-winner", (req, res) => {
    const { Category, Question, Answer, EnteredValue } = req.body;

    if (!Category || !Question || !Answer || !EnteredValue) {
        return res.status(400).send("Invalid data");
    }

    // Check if the winners.csv file exists
    if (!fs.existsSync(winnersFilePath)) {
        // Create the file and add the header row
        const header = "Category,Question,Answer,EnteredValue\n";
        fs.writeFileSync(winnersFilePath, header, "utf8");
    }

    // Read the existing file and update the record
    fs.readFile(winnersFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).send("Failed to read file");
        }

        const rows = data.split("\n").filter(row => row.trim() !== "");
        const updatedRows = [];
        let recordUpdated = false;

        rows.forEach((row, index) => {
            if (index === 0) {
                // Keep the header row as is
                updatedRows.push(row);
                return;
            }

            // Properly parse the CSV row to handle fields with commas
            const fields = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(field => field.replace(/^"|"$/g, "").trim());

            const [cat, ques, ans, val] = fields;
            if (cat === Category && ques === Question && ans === Answer) {
                // Update the existing record
                updatedRows.push(`"${Category}","${Question}","${Answer}","${EnteredValue}"`);
                recordUpdated = true;
            } else {
                updatedRows.push(row);
            }
        });

        if (!recordUpdated) {
            // Append the new record if it doesn't exist
            updatedRows.push(`"${Category}","${Question}","${Answer}","${EnteredValue}"`);
        }

        // Write the updated data back to the file
        fs.writeFile(winnersFilePath, updatedRows.join("\n"), "utf8", err => {
            if (err) {
                console.error("Error writing file:", err);
                return res.status(500).send("Failed to update file");
            }
            res.status(200).send("Data updated successfully");
        });
    });
});

// Endpoint to save winners.txt
app.post("/save-winners", (req, res) => {
    const winners = req.body; // Expecting an array of { question, winnerName }
    const filePath = path.join(__dirname, "assets", "winners.txt");

    // Read the existing file
    let existingData = [];
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        existingData = fileContent
            .split("\n")
            .filter(line => line)
            .map(line => {
                const [question, winnerName] = line.split(",");
                return { question, winnerName };
            });
    }

    // Update the data
    winners.forEach(winner => {
        const index = existingData.findIndex(w => w.question === winner.question);
        if (index !== -1) {
            existingData[index].winnerName = winner.winnerName; // Update existing
        } else {
            existingData.push(winner); // Add new
        }
    });

    // Write the updated data back to the file
    const fileContent = existingData.map(w => `${w.question},${w.winnerName}`).join("\n");
    fs.writeFileSync(filePath, fileContent);

    res.status(200).send("Winners file updated successfully.");
});

// Endpoint to save a single winner
app.post("/saveWinner", (req, res) => {
    const { category, question, answer, winnerName } = req.body;

    if (!category || !question || !answer || !winnerName) {
        return res.status(400).send("Invalid data");
    }

    // Check if the winners.csv file exists
    if (!fs.existsSync(winnersFilePath)) {
        // Create the file and add the header row
        const header = "Category,Question,Answer,WinnerName\n";
        fs.writeFileSync(winnersFilePath, header, "utf8");
    }

    // Read the existing file and update the record
    fs.readFile(winnersFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).send("Failed to read file");
        }

        const rows = data.split("\n").filter(row => row.trim() !== "");
        const updatedRows = [];
        let recordUpdated = false;

        rows.forEach((row, index) => {
            if (index === 0) {
                // Keep the header row as is
                updatedRows.push(row);
                return;
            }

            // Properly parse the CSV row to handle fields with commas
            const fields = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(field => field.replace(/^"|"$/g, "").trim());

            const [cat, ques, ans, win] = fields;
            if (cat === category && ques === question && ans === answer) {
                // Update the existing record
                updatedRows.push(`"${category}","${question}","${answer}","${winnerName}"`);
                recordUpdated = true;
            } else {
                updatedRows.push(row);
            }
        });

        if (!recordUpdated) {
            // Append the new record if it doesn't exist
            updatedRows.push(`"${category}","${question}","${answer}","${winnerName}"`);
        }

        // Write the updated data back to the file
        fs.writeFile(winnersFilePath, updatedRows.join("\n"), "utf8", err => {
            if (err) {
                console.error("Error writing file:", err);
                return res.status(500).send("Failed to update file");
            }
            res.status(200).send("Winner saved successfully");
        });
    });
});

// Function to save winners to file
async function saveWinnersToFile(winners) {
    await fetch("/save-winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(winners),
    });
}

// Function to save a winner to the server
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});