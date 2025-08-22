export async function loadQuestions(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }
        const csvText = await response.text();

        // Parse the CSV into an array of objects
        const rows = csvText.split("\n").filter(row => row.trim() !== ""); // Remove empty rows
        const headers = rows[0].split(",").map(h => h.trim().toLowerCase()); // Convert headers to lowercase

        return rows.slice(1).map(row => {
            // Use a regular expression to split the row while preserving quoted values
            const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!matches) {
                console.warn(`Skipping malformed row: ${row}`);
                return null;
            }
            const values = matches.map(value => value.replace(/(^"|"$)/g, "").trim());
            return headers.reduce((acc, header, index) => {
                acc[header] = values[index] || "";
                return acc;
            }, {});
        }).filter(Boolean); // Remove null entries
    } catch (error) {
        console.error("Error loading questions:", error);
        return [];
    }
}