const loadingScreen = document.getElementsByClassName("loading-screen")[0];
const loadingEllipsis = document.getElementsByClassName("loading-ellipsis")[0];
const loadingComment = document.getElementsByClassName("loading-comment")[0];
const htmlTag = document.getElementsByTagName("html")[0];

let isLoading = false;
let loadingMessageInterval;

async function loadData(answerTypes, answer) {
    Object.keys(answerTypes).forEach(async answerType => {
        answerTypes[answerType][0].placeholder = `${(String(answerType).charAt(0).toUpperCase() + String(answerType).slice(1)).slice(0, -1)}(s)`;
        answerTypes[answerType][0].disabled = false;
        answerTypes[answerType][0].value = "";
        answerTypes[answerType][1].innerText = "";
        answerTypes[answerType][2].innerHTML = "";

        await fetch(`./data/${answerType}.json`)
            .then(response => response.json())
            .then(data => {
                const answerOptions = answerType === "creators" ? data : getUserSetting("safe-mode") ? data["safe"] : data["safe"].concat(data["unsafe"]);

                answerOptions.forEach(answerOption => {
                    const option = document.createElement("option");

                    option.value = answerOption;
                    option.classList.add(answerOption.replaceAll(" ", "-"));

                    answerTypes[answerType][2].appendChild(option);
                });
            });

        if (answer[answerType].length === 0) {
            answerTypes[answerType][0].placeholder += " ✔";
            answerTypes[answerType][0].disabled = true;
        } else {
            answerTypes[answerType][0].placeholder += ` [${answer[answerType].length}]`;
        }
    });
}

async function loadInterface() {
    const lastSelectedDifficulty = getCookie("difficulty") ?? "easy";
    const lastSelectedDifficultyElement = document.getElementById(lastSelectedDifficulty);

    lastSelectedDifficultyElement.checked = true;
    defaultValues["difficulty"] = getCookie("difficulty") ?? "easy";

    Object.values(document.getElementsByClassName("option")).forEach(option => {
        const optionName = option.classList[0];
        const defaultValue = getCookie(optionName) ?? option.dataset.default;

        if (option.type !== "radio")
            option.checked = defaultValue === "true";

        option.addEventListener("input", () => {
            if (option.type === "checkbox")
                createCookie(optionName, option.checked);
            else
                createCookie("difficulty", option.id);
        });

        defaultValues[optionName] = defaultValue;
    });

    Object.values(document.getElementsByClassName("input")).forEach(input => {
        const inputName = input.classList[0];

        input.value = getCookie(inputName) ?? input.dataset.default;

        input.addEventListener("change", () => { createCookie(inputName, input.value); });

        defaultValues[inputName] = getCookie(inputName) ?? input.value;
    });

    clearCookiesButton.addEventListener("click", clearSettings);

    initialiseModals();
    updateHighScore();
}

async function loadLoadingScreen() {
    loadLoadingScreenComment("Loading the loading screen...");
    resetTimer();

    isLoading = true;

    clearInterval(loadingMessageInterval);

    loadingMessageInterval = setInterval(() => {
        if (loadingEllipsis.innerText.length === 3)
            loadingEllipsis.innerText = "";
        else
            loadingEllipsis.innerText += ".";
    }, 300);

    gameScreen.classList.remove("hide");
    loadingScreen.classList.remove("hide");
}

function loadLoadingScreenComment(comment) {
    loadingComment.innerText = comment;
}

async function loadRound(workID, answerTypes) {
    const answer = await loadWorkAndPlayer(workID);

    await loadData(answerTypes, answer);

    return answer;
}

async function loadWorkAndPlayer(workID) {
    loadLoadingScreenComment("Loading the work...");

    let creators;
    let sources;
    let songs;
    let ytpmvName;
    let ytpmvPlateform;
    let ytpmvThumbnail;

    await fetch(`./data/${Math.floor(workID / 1_000)}/${workID}.json`)
        .then(response => response.json())
        .then(async work => {
            creators = work["creators"];
            sources = work["sources"];
            songs = work["songs"];
            ytpmvName = work["name"];
            ytpmvPlateform = work["link"].includes("youtube") ? "YouTube" : work["link"].includes("nicovideo") ? "Niconico" : "SoundCloud";
            ytpmvThumbnail = work["thumbnail"];

            if (typeof ytpmvThumbnail !== "string")
                ytpmvThumbnail = "./assets/images/unsafe-warning.png";

            await loadPlayer(work, workID);
        });

    return { "creators": creators, "sources": sources, "songs": songs, "id": workID, "name": ytpmvName, "plateform": ytpmvPlateform, "thumbnail": ytpmvThumbnail };
}

async function playerHasLoaded() {
    isLoading = false;

    setTimeout(() => {
        if (!isLoading) {
            clearInterval(loadingMessageInterval);

            toggleShortcuts(true);

            console.log("%cYes, you can cheat very easily because I'm doing everything in frontend!", "color: red; font-size: 35px; font-weight: bold;");
            console.log("But this wasn't your plan, right?");

            seekBar.classList.add("disabled");
            loadingScreen.classList.add("hide");
            game.classList.remove("hide");
        }
    }, 6_500);
}

window.addEventListener("load", loadInterface);