const titleScreen = document.getElementsByClassName("title-screen")[0];
const userHighScore = document.getElementsByClassName("user-high-score")[0];
const gameScreen = document.getElementsByClassName("game-screen")[0];
const roundContainer = document.getElementsByClassName("round")[0];
const scoreContainer = document.getElementsByClassName("score")[0];
const timerContainer = document.getElementsByClassName("timer")[0];
const game = document.getElementsByClassName("game")[0];
const answerContainer = document.getElementsByClassName("answer")[0];
const answerTitle = document.getElementsByClassName("answer-title")[0];
const answerCreators = document.getElementsByClassName("answer-creators")[0];
const answerLink = document.getElementsByClassName("answer-link")[0];
const answerThumbnail = document.getElementsByClassName("answer-thumbnail")[0];
const answerSources = document.getElementsByClassName("answer-sources")[0];
const answerSongs = document.getElementsByClassName("answer-songs")[0];
const endScreen = document.getElementsByClassName("end-screen")[0];
const userScore = document.getElementsByClassName("user-score")[0];
const totalScore = document.getElementsByClassName("total-score")[0];
const answerTypes = {
    "creators": [document.getElementsByClassName("creators-input")[0], document.getElementsByClassName("found-creators")[0], document.getElementById("creators")],
    "sources": [document.getElementsByClassName("sources-input")[0], document.getElementsByClassName("found-sources")[0], document.getElementById("sources")],
    "songs": [document.getElementsByClassName("songs-input")[0], document.getElementsByClassName("found-songs")[0], document.getElementById("songs")]
};

var userAttempts = [];
var workIDs = [];
var userSettings;
let enableShortcuts = false;
let hasTimerStarted = false;
let maxRounds = 5;
let currentRound = 0;
let maxPoints = 0;
let score = 0;
let currentTimer = 0;
let correctStreak = 1;
let timerInterval;
let answer;

function createAnswerElement(answer, receiver) {
    const answerElement = document.createElement("li");

    answerElement.innerText = answer;

    receiver.append(answerElement);
}

async function finishGame() {
    createCookie("score", score);
    updateHighScore();

    userScore.innerText = score;
    totalScore.innerText = `${maxPoints} (${+(score / maxPoints * 100).toFixed(2)}%)`;

    endScreen.classList.remove("hide");
}

async function startNewRound(isSafeModeActivated, hadError = false) {
    answerContainer.classList.add("hide");

    if (!hadError && currentRound >= maxRounds) {
        finishGame();
    } else {
        await loadLoadingScreen();

        if (hadError) {
            workIDs[currentRound - 1] = await selectRandomWorks(1, workIDs, userSettings["safe"], true);
        } else {
            currentRound++;

            roundContainer.innerText = currentRound;
            userAttempts = [];

            await loadBackground();
        }

        game.classList.remove("hide");

        answer = await loadRound(workIDs[currentRound - 1], isSafeModeActivated, answerTypes);
    }
}

async function submitAnswers() {
    for (let i = 0; i < Object.keys(answerTypes).length; i++) {
        const answerType = Object.keys(answerTypes)[i];

        if (!userAttempts.includes(answerTypes[answerType][0].value) && answer[answerType].includes(answerTypes[answerType][0].value) && document.getElementsByClassName(answerTypes[answerType][0].value.replaceAll(" ", "-")).length === 1) {
            const remaining = Number(answerTypes[answerType][0].placeholder.split("[")[1].split("]")[0]);

            answerTypes[answerType][0].placeholder = `${answerTypes[answerType][0].placeholder.split(" ")[0]} ${remaining === 1 ? "✔" : `[${remaining - 1}]`}`;

            if (remaining === 1)
                answerTypes[answerType][0].disabled = true;

            const found = document.createElement("li");

            found.innerText = answerTypes[answerType][0].value;

            answerTypes[answerType][1].appendChild(found);

            score += Object.keys(answerTypes)[i] === "creators" ? 300 : 100 * correctStreak;

            correctStreak++;
        } else if (answerTypes[answerType][0].value !== "") {
            correctStreak = 1;
        }

        if (answerTypes[answerType][0].value !== "")
            userAttempts.push(answerTypes[answerType][0].value);

        if (document.getElementsByClassName(answerTypes[answerType][0].value.replaceAll(" ", "-")).length === 1) {
            document.getElementsByClassName(answerTypes[answerType][0].value.replaceAll(" ", "-"))[0]?.remove();

            answerTypes[answerType][0].value = "";
        }
    }

    scoreContainer.innerText = score;

    if (answerTypes["creators"][0].disabled && answerTypes["sources"][0].disabled && answerTypes["songs"][0].disabled)
        await revealAnswer();
}

function toggleShortcuts(toggle) {
    enableShortcuts = toggle;
}

function updateHighScore() {
    userHighScore.innerText = getCookie("score") ?? 0;
}

function resetTimer() {
    currentTimer = userSettings["timer"];
    timerContainer.innerText = secondsToTimestamp(currentTimer);
}

async function revealAnswer() {
    await stopYTPMV(true);
    stopTimer();
    toggleShortcuts(false);

    answerSources.innerHTML = "";
    answerSongs.innerHTML = "";
    answerThumbnail.src = "";

    correctStreak = 1;
    maxPoints += (answer["creators"].length * 300) + (50 * answer["sources"].length * (answer["sources"].length + 1)) + (50 * answer["songs"].length * (answer["songs"].length + 1));

    answerLink.href = `https://otodb.net/work/${answer["id"]}`;
    answerTitle.innerText = answer["name"];
    answerCreators.innerText = answer["creators"].length === 0 ? "Unknow" : answer["creators"].join(", ");
    answerThumbnail.src = answer["thumbnail"];

    await answer["sources"].forEach(source => {
        createAnswerElement(source, answerSources);
    });

    await answer["songs"].forEach(song => {
        createAnswerElement(song, answerSongs);
    });

    if (answer["sources"].length === 0)
        createAnswerElement("...", answerSources);
    if (answer["songs"].length === 0)
        createAnswerElement("...", answerSongs);

    game.classList.add("hide");
    answerContainer.classList.remove("hide");
}

async function startNewGame() {
    userSettings = getUserSettings();
    scoreContainer.innerText = "0";
    roundContainer.innerText = "1";
    maxRounds = userSettings["max-rounds"];
    maxPoints = 0;
    score = 0;
    currentRound = 0;
    correctStreak = 1;

    if (userSettings["timer"] != 0) {
        resetTimer();

        timerContainer.classList.remove("hide");
    } else {
        timerContainer.classList.add("hide");
    }

    endScreen.classList.add("hide");
    titleScreen.classList.add("hide");
    gameScreen.classList.remove("hide");

    workIDs = await selectRandomWorks(maxRounds, workIDs, userSettings["safe"]);

    await startNewRound(userSettings["safe"]);
}

async function startTimer() {
    if (userSettings["timer"] != 0 && !hasTimerStarted) {
        resetTimer();
        hasTimerStarted = true;

        timerInterval = setInterval(async () => {
            currentTimer--;
            timerContainer.innerText = secondsToTimestamp(currentTimer);

            if (currentTimer <= 0) {
                stopTimer();
                await revealAnswer();
            }
        }, 1_000);
    }
}

function stopTimer() {
    clearInterval(timerInterval);

    hasTimerStarted = false;
}

document.getElementsByClassName("start-button")[0].addEventListener("click", async () => {
    await startNewGame();
});

document.getElementsByClassName("submit-button")[0].addEventListener("click", async (event) => {
    event.preventDefault();

    await submitAnswers();
});

document.getElementsByClassName("reveal-button")[0].addEventListener("click", async (event) => {
    event.preventDefault();

    await revealAnswer();
});

document.getElementsByClassName("next-button")[0].addEventListener("click", async () => {
    await startNewRound(userSettings["safe"]);
});

document.getElementsByClassName("replay-button")[0].addEventListener("click", async () => {
    await startNewGame();
});

document.getElementsByClassName("title-screen-button")[0].addEventListener("click", async () => {
    gameScreen.classList.add("hide");
    endScreen.classList.add("hide");
    titleScreen.classList.remove("hide");

    showLoadingScreen();
});

document.addEventListener("keyup", async event => {
    if (enableShortcuts && document.activeElement.tagName !== "INPUT") {
        if (event.code === "Space" || event.key === "Space" || event.code === "KeyK" || event.key === "k") {
            await playOrPauseYTPMV();
        } else if (event.code === "Backspace" || event.key === "Backspace" || event.code === "Numpad0" || event.key === "0" || event.code === "Digit0" || event.key === "à") {
            await stopYTPMV();
        } else if (event.code === "ArrowLeft" || event.key === "ArrowLeft" || event.code === "KeyL" || event.key === "l") {
            await shiftPlayerHead(-5);
        } else if (event.code === "ArrowRight" || event.key === "ArrowRight" || event.code === "KeyJ" || event.key === "j") {
            await shiftPlayerHead(5);
        } else if (event.code === "ShiftLeft" || event.key === "Shift") {
            answerTypes[Object.keys(answerTypes)[0]][0].focus();
        }
    }
});