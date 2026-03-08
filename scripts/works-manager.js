async function handleBrokenLink(wordID, error) {
    loadLoadingScreenComment("Error while loading the YTPMV, looking for a new one...");

    console.log(`Problem with work ${wordID} : impossible to load the video. Reason given below.`);
    console.error(error);

    await startNewRound(userSettings["safe"], true);
}

async function selectRandomWorks(rounds, workIDs, isSafeModeActivated, onlyOne = false) {
    loadLoadingScreenComment("Fetching YTPMVs...");

    const selectedWorkIDs = [];

    await fetch("./data/work-ids.json")
        .then(response => response.json())
        .then(works => {
            const selectedMode = getCookie("mode") ?? "classic";
            const everyGameModes = ["sources-only", "songs-only", "collab", "multisource"];
            let workList;

            if (selectedMode === "classic") {
                workList = works["safe"];

                everyGameModes.forEach(gameMode => {
                    workList.concat(works[gameMode]["safe"]);
                });

                if (!isSafeModeActivated) {
                    workList.concat(works["unsafe"]);

                    everyGameModes.forEach(gameMode => {
                        workList.concat(works[gameMode]["unsafe"]);
                    });
                }
            } else {
                workList = works[selectedMode]["safe"];

                if (!isSafeModeActivated)
                    workList.concat(works[selectedMode]["unsafe"]);
            }

            let randomWorkID = -1;

            for (let i = 0; i < rounds; i++) {
                do {
                    randomWorkID = workList[Math.floor(Math.random() * workList.length)];
                } while (selectedWorkIDs.includes(randomWorkID) || (workIDs.length > 0 && workIDs.includes(randomWorkID)));

                selectedWorkIDs.push(randomWorkID);
            }
        });

    if (onlyOne)
        return selectedWorkIDs[0];
    else
        return selectedWorkIDs;
}