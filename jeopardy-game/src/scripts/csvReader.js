/**
 * Loads and parses questions from a CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Array of question objects
 */
export async function loadQuestions(filePath) {
    try {
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error("Error loading questions:", error);
        return [];
    }
}

/**
 * Parses CSV text into an array of question objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of question objects
 */
function parseCSV(csvText) {
    const rows = csvText
        .split("\n")
        .filter(row => row.trim() !== "");
    
    if (rows.length === 0) {
        return [];
    }
    
    const headers = rows[0]
        .split(",")
        .map(header => header.trim().toLowerCase());
    
    return rows.slice(1)
        .map(row => parseCSVRow(row, headers))
        .filter(Boolean);
}

/**
 * Parses a single CSV row into an object
 * @param {string} row - CSV row string
 * @param {Array} headers - Array of header names
 * @returns {Object|null} Question object or null if malformed
 */
function parseCSVRow(row, headers) {
    const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    
    if (!matches) {
        console.warn(`Skipping malformed row: ${row}`);
        return null;
    }
    
    const values = matches.map(value => 
        value.replace(/(^"|"$)/g, "").trim()
    );
    
    return headers.reduce((acc, header, index) => {
        acc[header] = values[index] || "";
        return acc;
    }, {});
}