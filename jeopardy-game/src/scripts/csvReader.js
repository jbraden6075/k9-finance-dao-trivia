export async function loadQuestions(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }
        const csvText = await response.text();

        // Parse the CSV into an array of objects
        const rows = csvText.split("\n").filter(row => row.trim() !== ""); // Remove empty rows
        const headers = rows[0].split(","); // Extract headers from the first row

        return rows.slice(1).map(row => {
            // Use a regular expression to split the row while preserving quoted values
            const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(value => value.replace(/(^"|"$)/g, "").trim());
            return headers.reduce((acc, header, index) => {
                acc[header] = values[index];
                return acc;
            }, {});
        });
    } catch (error) {
        console.error("Error loading questions:", error);
        return [];
    }
}