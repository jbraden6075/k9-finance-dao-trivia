# Jeopardy Game

This is a simple Jeopardy game implemented in JavaScript, HTML, and CSS. The game reads questions from a CSV file and provides an interactive user interface for players to answer questions based on different categories.

## Project Structure

```
jeopardy-game
├── src
│   ├── index.html        # Main HTML document for the game
│   ├── styles
│   │   └── style.css     # CSS styles for the game UI
│   ├── scripts
│   │   ├── app.js        # Main JavaScript file for game logic
│   │   └── csvReader.js  # Functions to read and parse CSV file
│   └── assets
│       └── questions.csv  # CSV file containing categories, questions, and answers
├── package.json          # npm configuration file
└── README.md             # Project documentation
```

## Getting Started

To run the Jeopardy game locally, follow these steps:

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd jeopardy-game
   ```

2. **Install dependencies**:
   If there are any dependencies listed in `package.json`, run:
   ```
   npm install
   ```

3. **Open the game**:
   Open `src/index.html` in your web browser to start playing the game.

## Game Functionality

- The game displays categories and questions loaded from the `questions.csv` file.
- Players can select a question to answer, and the game will check if the answer is correct.
- The UI updates based on player interactions, providing feedback on correct or incorrect answers.

## Contributing

Feel free to submit issues or pull requests if you would like to contribute to the project.