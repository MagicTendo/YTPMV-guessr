async function manageShortcuts(keyEvent) {
    if (enableShortcuts && document.activeElement.tagName !== "INPUT") {
        if (keyEvent.code === "Space" || keyEvent.key === "Space" || keyEvent.code === "KeyK" || keyEvent.key === "k") {
            await playOrPauseYTPMV();
        } else if (keyEvent.code === "Backspace" || keyEvent.key === "Backspace" || keyEvent.code === "Numpad0" || keyEvent.key === "0" || keyEvent.code === "Digit0" || keyEvent.key === "à") {
            await stopYTPMV();
        } else if (keyEvent.code === "ArrowLeft" || keyEvent.key === "ArrowLeft" || keyEvent.code === "KeyJ" || keyEvent.key === "j") {
            await backwardSeekTime();
        } else if (keyEvent.code === "ArrowRight" || keyEvent.key === "ArrowRight" || keyEvent.code === "KeyL" || keyEvent.key === "l") {
            await forwardSeekTime();
        } else if (keyEvent.code === "ShiftLeft" || keyEvent.key === "Shift") {
            answerTypes[Object.keys(answerTypes)[0]][0].focus();
        }
    }
}

function prepareTitleScreen() {
    gameScreen.classList.add("hide");
    game.classList.add("hide");
    endScreen.classList.add("hide");
    titleScreen.classList.remove("hide");
}