let colors = generateRandomColors(6);
let pickedColor = pickColor();
let squares = document.querySelectorAll(".square");
let colorDisplay = document.getElementById("color-display");
let messageDisplay = document.getElementById("message");
let resetButton = document.getElementById("reset");
let h1 = document.querySelector("h1");

// Update the Heading to show the target color
colorDisplay.textContent = pickedColor;

// Reset Button Logic
resetButton.addEventListener("click", function() {
    colors = generateRandomColors(6);
    pickedColor = pickColor();
    colorDisplay.textContent = pickedColor;
    h1.style.backgroundColor = "steelblue";
    messageDisplay.textContent = "";
    resetButton.textContent = "New Colors";
    
    for(let i = 0; i < squares.length; i++) {
        squares[i].style.backgroundColor = colors[i];
    }
});

// Setup Squares
for(let i = 0; i < squares.length; i++) {
    // Add initial colors
    squares[i].style.backgroundColor = colors[i];

    // Add click listeners
    squares[i].addEventListener("click", function() {
        let clickedColor = this.style.backgroundColor;
        
        if(clickedColor === pickedColor) {
            messageDisplay.textContent = "Correct!";
            changeColors(clickedColor); // Change all squares to winning color
            h1.style.backgroundColor = clickedColor;
            resetButton.textContent = "Play Again?";
        } else {
            this.style.backgroundColor = "#232323"; // Fade out wrong choice
            messageDisplay.textContent = "Try Again";
        }
    });
}

function changeColors(color) {
    // Loop through all squares and change to match given color
    for(let i = 0; i < squares.length; i++) {
        squares[i].style.backgroundColor = color;
    }
}

function pickColor() {
    let random = Math.floor(Math.random() * colors.length);
    return colors[random];
}

function generateRandomColors(num) {
    let arr = [];
    for(let i = 0; i < num; i++) {
        // get random color and push into arr
        arr.push(randomColor());
    }
    return arr;
}

function randomColor() {
    // pick a "red" from 0 - 255
    let r = Math.floor(Math.random() * 256);
    // pick a "green" from 0 - 255
    let g = Math.floor(Math.random() * 256);
    // pick a "blue" from 0 - 255
    let b = Math.floor(Math.random() * 256);
    return "rgb(" + r + ", " + g + ", " + b + ")";
}