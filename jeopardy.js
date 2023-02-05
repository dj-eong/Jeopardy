// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const categories = [];
const table = document.querySelector('#jeopardy');
const startButton = document.querySelector('#start');
const loadingWheel = document.querySelector('#spin-container');

// Requests 6 random categories from Jeopardy API
// Returns an array of just the category IDs
async function getCategoryIds() {
    const random = Math.floor(Math.random() * 28158);
    const config = { params: { count: 6, offset: random } };
    const res = await axios.get('https://jservice.io/api/categories', config);
    return res.data.map(function (obj) {
        return obj.id;
    });
}

// Requests a specific category using a category ID from Jeopardy API
// Returns an object with data about a category in the format of:
// { title: "Math", clues: clue-array }
// Where clue-array is an array of objects consisting of:
//   [
//     {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//     {question: "Bell Jar Author", answer: "Plath", showing: null},
//     ...
//   ]
async function getCategory(catId) {
    const config = { params: { id: catId } };
    const res = await axios.get('https://jservice.io/api/category', config);

    const cluesArray = res.data.clues.map(function (obj) {
        return { question: obj.question, answer: obj.answer, showing: null };
    });
    const fiveCluesArray = getFiveRandomClues(cluesArray);
    return { title: res.data.title, clues: fiveCluesArray };
}

// Every category has a varying number of clues
// Returns an array of 5 randomly picked clues from list of clues within a category
function getFiveRandomClues(cluesArray) {
    const array = [];
    for (let i = 0; i < 5; i++) {
        let randomInd = Math.floor(Math.random() * cluesArray.length);
        array.push(cluesArray.splice(randomInd, 1)[0]);
    }
    return array;
}

// Fills the categories JS data structure, an array of objects, with each object consisting of a category title and 5 clues
async function fillCatArray() {
    categories.length = 0;
    const arrayOfIds = await getCategoryIds();
    for (id of arrayOfIds) {
        categories.push(await getCategory(id));
    }
    // console.log(categories);
}

// Fills the HTML table #jeopardy with visible cells for the user to see and interact with
function fillHTMLTable() {
    // The top row is filled with the category titles
    const top = document.createElement('tr');
    top.id = 'top-row';

    for (let x = 0; x < categories.length; x++) {
        const headCell = document.createElement('td');
        headCell.innerText = categories[x].title.toUpperCase();
        top.append(headCell);
    }
    table.firstElementChild.append(top);

    // The rest of the table is filled with '?' marks for now
    // Each cell is given a unique ID
    for (let y = 0; y < 5; y++) {
        const row = document.createElement('tr');
        for (let x = 0; x < categories.length; x++) {
            const cell = document.createElement('td');
            cell.innerText = '?';
            cell.id = `${x}${y}`;
            row.append(cell);
        }
        table.lastElementChild.append(row);
    }
    table.lastElementChild.addEventListener('mouseup', handleClick);
}

// When the user clicks on a cell, it reveals either the question or the answer
function handleClick(evt) {
    // Take the unique ID of the cell that was clicked on 
    // and identify the corresponding category (column) and row
    const cellId = evt.target.id;
    const clickedCategory = cellId[0];
    const clickedRow = cellId[1];
    const clickedCell = document.getElementById(`${cellId}`);

    // Use the abstracted ID to find the corresponding clue in the categories JS data structure 
    // and update the HTML table cell with the proper text (question/answer)
    const jsCategory = categories[clickedCategory].clues[clickedRow];
    if (!jsCategory) {
        clickedCell.innerText = 'FREEBIE!';
    } else if (!jsCategory.showing) {
        clickedCell.innerText = jsCategory.question;
        jsCategory.showing = 'question';
    } else if (jsCategory.showing === 'question') {
        clickedCell.innerText = jsCategory.answer;
        jsCategory.showing = 'answer';
    }
}

// Wipes the current Jeopardy board and shows the loading spinner
function showLoadingView() {
    table.firstElementChild.innerHTML = '';
    table.lastElementChild.innerHTML = '';
    loadingWheel.style.display = '';
    startButton.style.pointerEvents = 'none';
}

// Hides the loading spinner and updates Start button to Restart
function hideLoadingView() {
    loadingWheel.style.display = 'none';
    startButton.innerText = 'Restart!';
    startButton.style.pointerEvents = '';
}

// Sets up everything and starts the Jeopardy game
async function setupAndStart() {
    showLoadingView();
    await fillCatArray();
    fillHTMLTable();
    hideLoadingView();
}

startButton.addEventListener('click', setupAndStart);