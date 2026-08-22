async function handleBrokenLink(wordID, error) {
    loadLoadingScreenComment("Error while loading the work, looking for a new one...");

    console.log(`Problem with work ${wordID} : impossible to load the video. Reason given below.`);
    console.error(error);

    await startNewRound(getUserSetting("safe-mode"), true);
}

async function selectRandomWorks(rounds, workIDs, isSafeModeActivated, onlyOne = false) {
    loadLoadingScreenComment("Fetching works...");

    const selectedWorkIDs = [];

    rounds = onlyOne ? 1 : +rounds;

    await fetch("./data/work-ids.json")
        .then(response => response.json())
        .then(works => {
            const selectedDifficulty = getUserSetting("difficulty");
            const difficulties = ["easy", "medium", "hard"];
            const difficultyHierarchie = selectedDifficulty === "easy" ? 1 : selectedDifficulty === "medium" ? 2 : 3;
            const workList = [];
            let randomWorkID;

            for (let i = 0; i < difficultyHierarchie; i++) {
                workList.push(...works[difficulties[i]]["safe"]);

                if (!isSafeModeActivated)
                    workList.push(...works[difficulties[i]]["unsafe"]);
            }

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