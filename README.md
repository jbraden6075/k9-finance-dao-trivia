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
   Open 'jeopardy-game\src\assets\questions.csv' and populate with categories, questions, and answers.
   In the terminal, enter: `node server.js`
   In the terminal, hold down CTRL + left click on the localhost link in the terminal.

## Game Functionality

- The game displays categories and questions loaded from the `questions.csv` file.
- Players can select a question to answer. The host will click on the numbered box under the category the user selects, and the game will display the question in full screen.
- Once the answer is presented, the host will click on the question and the answer will display on the screen.
- Clicking the answer will display the game board and the host can enter the winner's name in the box and click the KNINE logo.
- The UI updates based on player interactions, providing feedback on correct or incorrect answers.

## Contributing

Feel free to submit issues or pull requests if you would like to contribute to the project.