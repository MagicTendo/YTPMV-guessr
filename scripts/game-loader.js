const loadingScreen = document.getElementsByClassName("loading-screen")[0];
const loadingEllipsis = document.getElementsByClassName("loading-ellipsis")[0];
const loadingComment = document.getElementsByClassName("loading-comment")[0];
const htmlTag = document.getElementsByTagName("html")[0];

var isLoading = false;
var loadingMessageInterval;

async function loadBackground() {
    loadLoadingScreenComment("Loading the background image...");

    const backgrounds = ["akkariin", "billy-mays", "cat-planet", "hh-gregg", "kabikira", "kill-me-baby", "kitchen-gun", "koopa", "michael-rosen", "mrbeast", "octagon", "old-spice", "padoru", "shibamata", "tom-scott"];
    let randomBackgroundIndex;
    let randomBackground;

    do {
        randomBackgroundIndex = Math.floor(Math.random() * backgrounds.length);
        randomBackground = backgrounds[randomBackgroundIndex];
    } while (htmlTag.style.backgroundImage?.includes(randomBackground));

    htmlTag.style.backgroundImage = `url("./assets/images/backgrounds/${randomBackground}.png")`;
}

async function loadData(isSafeModeActivated, answerTypes, answer) {
    answerTypes["creators"][0].placeholder = "Creator(s)";
    answerTypes["sources"][0].placeholder = "Source(s)";
    answerTypes["songs"][0].placeholder = "Song(s)";

    Object.keys(answerTypes).forEach(async answerType => {
        answerTypes[answerType][0].disabled = false;
        answerTypes[answerType][0].value = "";
        answerTypes[answerType][1].innerText = "";
        answerTypes[answerType][2].innerHTML = "";

        await fetch(`./data/${answerType}.json`)
            .then(response => response.json())
            .then(data => {
                const answerOptions = answerType === "creators" ? data : isSafeModeActivated ? data["safe"] : data["safe"].concat(data["unsafe"]);

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

    loadingScreen.classList.remove("hide");
}

function loadLoadingScreenComment(comment) {
    loadingComment.innerText = comment;
}

async function loadRound(workID, isSafeModeActivated, answerTypes) {
    const answer = await loadWorkAndPlayer(workID);

    await loadData(isSafeModeActivated, answerTypes, answer);

    return answer;
}

async function loadWorkAndPlayer(workID) {
    loadLoadingScreenComment("Loading the YTPMV...");

    let creators;
    let sources;
    let songs;
    let ytpmvName;
    let ytpmvThumbnail;

    await fetch(`./data/${Math.floor(workID / 1_000)}/${workID}.json`)
        .then(response => response.json())
        .then(async work => {
            creators = work["creators"];
            sources = work["sources"];
            songs = work["songs"];
            ytpmvName = work["name"];
            ytpmvThumbnail = work["thumbnail"];

            if (typeof ytpmvThumbnail !== "string")
                ytpmvThumbnail = "./assets/images/unsafe-warning.png";

            await loadPlayer(work, workID);
        });

    return { "creators": creators, "sources": sources, "songs": songs, "id": workID, "name": ytpmvName, "thumbnail": ytpmvThumbnail };
}

async function playerHasLoaded() {
    isLoading = false;

    setTimeout(() => {
        if (!isLoading) {
            clearInterval(loadingMessageInterval);

            loadingScreen.classList.add("hide");

            toggleShortcuts(true);
        }
    }, 6_500);
}

function showLoadingScreen() {
    loadingScreen.classList.remove("hide");
}