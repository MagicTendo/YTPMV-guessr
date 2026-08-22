const titleScreen = document.getElementsByClassName("title-screen")[0];
const userHighScore = document.getElementsByClassName("user-high-score")[0];
const roundOverlay = document.getElementsByClassName("round")[0];
const scoreOverlay = document.getElementsByClassName("score")[0];
const timerOverlay = document.getElementsByClassName("timer")[0];
const gameScreen = document.getElementsByClassName("game-screen")[0];
const game = document.getElementsByClassName("game")[0];
const ytpmvName = document.getElementsByClassName("ytpmv-name")[0];
const ytpmvCreators = document.getElementsByClassName("ytpmv-creators")[0];
const ytpmvPlateform = document.getElementsByClassName("ytpmv-plateform")[0];
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

let answerTypes = {
    "sources": [document.getElementsByClassName("sources-input")[0], document.getElementsByClassName("found-sources")[0], document.getElementById("sources")],
    "songs": [document.getElementsByClassName("songs-input")[0], document.getElementsByClassName("found-songs")[0], document.getElementById("songs")]
};

let enableShortcuts = false;
let hasTimerStarted = false;
let isDead = false;
let maxRounds = 5;
let currentRound = 1;
let maxPoints = 0;
let score = 0;
let currentTimer = 0;
let correctStreak = 1;
let timerInterval;
let answer;
let userAttempts = [];
let workIDs = [];

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

async function startNewRound(hadError = false) {
    answerContainer.classList.add("hide");

    if (isDead || (!hadError && currentRound >= maxRounds)) {
        isDead = false;

        finishGame();
    } else {
        await loadLoadingScreen();

        if (hadError) {
            workIDs[currentRound - 1] = await selectRandomWorks(1, workIDs, getUserSetting("safe"), true);
        } else {
            currentRound++;

            roundOverlay.innerText = currentRound;
            userAttempts = [];
        }

        answer = await loadRound(workIDs[currentRound - 1], answerTypes);
    }

    if (getUserSetting("show-name"))
        ytpmvName.innerText = answer["name"];
    else
        ytpmvName.innerText = "? ? ?";

    if (getUserSetting("show-creators"))
        ytpmvCreators.innerText = `By ${answer["creators"].length === 0 ? "Unknow" : answer["creators"].join(", ")}`;
    else
        ytpmvCreators.innerText = "By ? ? ?";

    if (getUserSetting("show-plateform"))
        ytpmvPlateform.innerText = `On ${answer["plateform"]}`;
    else
        ytpmvPlateform.innerText = "On ? ? ?";
}

async function submitAnswers() {
    let hasWrongAnswer = false;

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

            score += Object.keys(answerTypes)[i] === "creators" ? 500 : 100 * correctStreak;

            correctStreak++;
        } else if (answerTypes[answerType][0].value !== "") {
            correctStreak = 1;
            hasWrongAnswer = true;
        }

        if (answerTypes[answerType][0].value !== "")
            userAttempts.push(answerTypes[answerType][0].value);

        if (document.getElementsByClassName(answerTypes[answerType][0].value.replaceAll(" ", "-")).length === 1) {
            document.getElementsByClassName(answerTypes[answerType][0].value.replaceAll(" ", "-"))[0]?.remove();

            answerTypes[answerType][0].value = "";
        }
    }

    scoreOverlay.innerText = score;

    if (getUserSetting("death-match") && hasWrongAnswer)
        isDead = true;

    if (isDead || ((!getUserSetting("creators") || answerTypes["creators"]?.[0].disabled) && answerTypes["sources"][0].disabled && answerTypes["songs"][0].disabled))
        await revealAnswer();
}

function toggleShortcuts(toggle) {
    enableShortcuts = toggle;
}

function updateHighScore() {
    userHighScore.innerText = getCookie("score") ?? 0;
}

function resetTimer() {
    timerOverlay.innerText = secondsToTimestamp(getUserSetting("timer-amount"));
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
    scoreOverlay.innerText = "0";
    roundOverlay.innerText = "1";
    maxRounds = getUserSetting("max-rounds");
    maxPoints = 0;
    score = 0;
    currentRound = 1;
    correctStreak = 1;

    if (getUserSetting("timer-amount") != 0) {
        resetTimer();

        timerOverlay.classList.remove("hide");
    } else {
        timerOverlay.classList.add("hide");
    }

    answerTypes["creators"] = [document.getElementsByClassName("creators-input")[0], document.getElementsByClassName("found-creators")[0], document.getElementById("creators")];

    if (getUserSetting("creators")) {
        answerTypes["creators"][0].classList.remove("hide");
        answerTypes["creators"][1].classList.remove("hide");
    } else {
        answerTypes["creators"][0].classList.add("hide");
        answerTypes["creators"][1].classList.add("hide");

        delete answerTypes["creators"];
    }

    endScreen.classList.add("hide");
    titleScreen.classList.add("hide");

    workIDs = await selectRandomWorks(maxRounds, workIDs, getUserSetting("safe-mode"));

    await startNewRound(getUserSetting("safe-mode"));
}

async function startTimer() {
    if (getUserSetting("timer-amount") != 0 && !hasTimerStarted) {
        resetTimer();

        currentTimer = getUserSetting("timer-amount");
        hasTimerStarted = true;

        timerInterval = setInterval(async () => {
            currentTimer--;
            timerOverlay.innerText = secondsToTimestamp(currentTimer);

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

document.getElementsByClassName("title-screen-button")[0].addEventListener("click", prepareTitleScreen);
document.getElementsByClassName("start-button")[0].addEventListener("click", startNewGame);
document.getElementsByClassName("submit-button")[0].addEventListener("click", submitAnswers);
document.getElementsByClassName("reveal-button")[0].addEventListener("click", revealAnswer);
document.getElementsByClassName("replay-button")[0].addEventListener("click", startNewGame);
document.getElementsByClassName("next-button")[0].addEventListener("click", async () => { await startNewRound() });
document.addEventListener("keyup", manageShortcuts);