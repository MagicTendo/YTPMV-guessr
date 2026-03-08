const playButton = document.getElementsByClassName("play-button")[0];
const seekBar = document.getElementsByClassName("seek-bar")[0];
const currentTime = document.getElementsByClassName("current-time")[0];
const totalDuration = document.getElementsByClassName("total-duration")[0];
const nicovideoPlayerIframe = document.getElementById("nicovideo-player");
const soundCloudPlayerIframe = document.getElementById("soundcloud-player");

let youtubePlayerIframe = document.getElementById("youtube-player");
let isPlaying = false;
let isNicoVideoPlaying = false;
let hasYTPMVLoaded = false;
let loadingTimeout;
let timeUpdateInterval;
let loadingInterval;
let playerType;
let youtubePlayer;
let soundCloudPlayer;
let currentWorkID;

async function changeSeekTime(newTime) {
    if (playerType === "youtube" && youtubePlayerIframe.src !== "") {
        await youtubePlayer.seekTo(newTime, true);
    } else if (playerType === "nicovideo" && nicovideoPlayerIframe.src !== "") {
        await nicovideoPlayerIframe.contentWindow.postMessage({
            sourceConnectorType: 1,
            playerId: "1",
            eventName: "seek",
            data: {
                time: newTime * 1_000
            }
        }, "https://embed.nicovideo.jp");
    } else if (playerType === "soundcloud" && soundCloudPlayerIframe.src !== "") {
        await soundCloudPlayer.seekTo(newTime * 1_000);
    }

    updateTimestamps();
    updatePlayButton();
}

function endPlayer() {
    isPlaying = false;

    updateSeekBar(seekBar.max);
    updatePlayButton();
}

async function isYTPMVPlaying() {
    let isYTPMVPlaying = false;

    if (playerType === "youtube")
        isYTPMVPlaying = youtubePlayer?.getPlayerState() === 1;
    else if (playerType === "nicovideo")
        isYTPMVPlaying = isNicoVideoPlaying;
    else if (playerType === "soundcloud")
        soundCloudPlayer.isPaused((isPaused) => { isYTPMVPlaying = !isPaused });

    return isYTPMVPlaying;
}

async function loadPlayer(work, workID) {
    loadLoadingScreenComment("Loading the corresponding player and checking if the YTPMV is playable...");

    youtubePlayerIframe.src = "";
    nicovideoPlayerIframe.src = "";
    soundCloudPlayerIframe.src = "";
    hasYTPMVLoaded = false;
    seekBar.value = 0;
    seekBar.max = 0;
    currentWorkID = workID;

    if (playerType === "youtube") {
        const currentYouTubeIframe = youtubePlayer.getIframe();
        const parentElement = currentYouTubeIframe.parentNode;
        const playerClone = currentYouTubeIframe.cloneNode();

        await youtubePlayer.destroy();
        await parentElement.prepend(playerClone);

        youtubePlayerIframe = playerClone;
    }

    if (work["link"].includes("youtube")) {
        youtubePlayerIframe.src = `https://www.youtube-nocookie.com/embed/${work["link"].split("watch?v=")[1]}?enablejsapi=1&showinfo=0`;
        playerType = "youtube";
    } else if (work["link"].includes("nicovideo")) {
        nicovideoPlayerIframe.src = `https://embed.nicovideo.jp/watch/${work["link"].split("watch/")[1]}?jsapi=1&playerId=1`;
        playerType = "nicovideo";
    } else if (work["link"].includes("soundcloud")) {
        soundCloudPlayerIframe.src = `https://w.soundcloud.com/player/?url=https://soundcloud.com/${work["link"].split("soundcloud.com/")[1]}`;
        playerType = "soundcloud";
    }

    if (playerType === "youtube") {
        try {
            youtubePlayer = await new YT.Player("youtube-player", {
                events: {
                    onReady: async () => {
                        try {
                            await loadSeekBar(await youtubePlayer.getDuration());
                        } catch (error) {
                            await handleBrokenLink(workID, error);
                        }
                    },
                    onStateChange: async (event) => {
                        if (event.data == YT.PlayerState.ENDED)
                            endPlayer();
                    }
                }
            });
        } catch (error) {
            await handleBrokenLink(workID, error);
        }
    } else if (playerType === "soundcloud") {
        try {
            const retryRequest = setInterval(async () => {
                soundCloudPlayer = SC.Widget(soundCloudPlayerIframe);

                await soundCloudPlayer.bind(SC.Widget.Events.READY, function () {
                    soundCloudPlayer.getDuration(async (duration) => {
                        await loadSeekBar(duration / 1_000);
                        clearInterval(retryRequest);
                    });
                });

                await soundCloudPlayer.bind(SC.Widget.Events.FINISH, async function () {
                    isPlaying = false;

                    updateSeekBar(seekBar.max);
                    updatePlayButton();
                });
            }, 5_000);
        } catch (error) {
            await handleBrokenLink(workID, error);
        }
    }

    loadingTimeout = setTimeout(async () => {
        if (!hasYTPMVLoaded)
            await handleBrokenLink(workID, "Player took too long to respond.");
    }, 15_000);
}

async function playOrPauseYTPMV() {
    if (playerType === "youtube" && youtubePlayerIframe.src !== "") {
        isPlaying ? await youtubePlayer.pauseVideo() : await youtubePlayer.playVideo();
    } else if (playerType === "nicovideo" && nicovideoPlayerIframe.src !== "") {
        await nicovideoPlayerIframe.contentWindow.postMessage({
            sourceConnectorType: 1,
            playerId: "1",
            eventName: isPlaying ? "pause" : "play"
        }, "https://embed.nicovideo.jp");
    } else if (playerType === "soundcloud" && soundCloudPlayerIframe.src !== "") {
        if (isPlaying && seekBar.value === seekBar.max)
            isPlaying = false;

        isPlaying ? soundCloudPlayer.pause() : soundCloudPlayer.play();
    }

    isPlaying = !isPlaying;

    if (isPlaying && playerType !== "soundcloud") {
        loadingInterval = setInterval(async () => {
            if (await isYTPMVPlaying()) {
                if (seekBar.disabled)
                    seekBar.disabled = false;

                playButton.innerText = "⏸️";

                await startTimer();
                clearInterval(loadingInterval);
            } else {
                playButton.innerText = "⏳";
            }
        }, 500);
    } else {
        if (seekBar.disabled && playerType === "soundcloud")
            seekBar.disabled = false;

        updatePlayButton();
    }

    if (isPlaying && seekBar.value === seekBar.max) {
        updateSeekBar(0);
    } else {
        await updateTimestamps();
    }

    timeUpdateInterval = setInterval(updateTimestamps, 1_000);
}

async function loadSeekBar(total) {
    totalDuration.innerText = secondsToTimestamp(total);
    seekBar.max = total;

    if (total <= 0 || isNaN(total)) {
        await handleBrokenLink(currentWorkID, "Invalid duration (maybe either deleted, private or age restricted).");
    } else {
        hasYTPMVLoaded = true;

        clearTimeout(loadingTimeout);
        await playerHasLoaded();
    }
}

function secondsToTimestamp(seconds) {
    return new Date(seconds * 1_000).toISOString().slice(14, 19);
}

async function shiftPlayerHead(amount) {
    await changeSeekTime(Math.max(0, Math.min(seekBar.valueAsNumber + amount, Number(seekBar.max))));
}

async function stopYTPMV(roundEnded = false) {
    if (roundEnded)
        seekBar.disabled = true;

    isPlaying = false;

    clearInterval(timeUpdateInterval);
    updateSeekBar(0);
    updatePlayButton();

    if (playerType === "youtube" && youtubePlayerIframe.src !== "") {
        await youtubePlayer.stopVideo();
    } else if (playerType === "nicovideo" && nicovideoPlayerIframe.src !== "") {
        await changeSeekTime(0);

        await nicovideoPlayerIframe.contentWindow.postMessage({
            sourceConnectorType: 1,
            playerId: "1",
            eventName: "pause"
        }, "https://embed.nicovideo.jp");
    } else if (playerType === "soundcloud" && soundCloudPlayerIframe.src !== "") {
        soundCloudPlayer.seekTo(0);
        soundCloudPlayer.pause();
    }
}

function updatePlayButton() {
    if (isPlaying) {
        playButton.innerText = "⏸️";
    } else {
        playButton.innerText = "▶️";

        clearInterval(timeUpdateInterval);
        clearInterval(loadingInterval);
    }
}

function updateSeekBar(current) {
    currentTime.innerText = secondsToTimestamp(current);
    seekBar.value = current;
}

async function updateTimestamps() {
    if (seekBar.value === seekBar.max) {
        isPlaying = false;

        clearInterval(timeUpdateInterval);
    } else {
        if (playerType === "youtube") {
            updateSeekBar(await youtubePlayer.getCurrentTime());
        } else if (playerType === "soundcloud") {
            await soundCloudPlayer.getPosition(async (duration) => {
                updateSeekBar(duration / 1_000);
            });
        }
    }
}

playButton.addEventListener("click", async () => {
    await playOrPauseYTPMV();
});

document.getElementsByClassName("stop-button")[0].addEventListener("click", async () => {
    await stopYTPMV();
});

["input", "change"].forEach(event => seekBar.addEventListener(event, async (event) => {
    changeSeekTime(event.target.valueAsNumber);
}));

window.addEventListener("message", async (event) => {
    if (event.origin === "https://embed.nicovideo.jp" && playerType === "nicovideo") {
        if (event["data"]["eventName"] === "loadComplete") {
            await loadSeekBar(event["data"]["data"]["videoInfo"]["lengthInSeconds"]);
        } else if (event["data"]["eventName"] === "playerMetadataChange") {
            updateSeekBar(Math.round(event["data"]["data"]["currentTime"]) / 1_000);
        } else if (event["data"]["eventName"] === "playerStatusChange" && event["data"]["data"]["playerStatus"] === 4) {
            isNicoVideoPlaying = false;
            endPlayer();
        } else if (event["data"]["eventName"] === "playerStatusChange" && event["data"]["data"]["playerStatus"] === 3) {
            isNicoVideoPlaying = false;
        } else if (event["data"]["eventName"] === "playerStatusChange" && event["data"]["data"]["playerStatus"] === 2) {
            isNicoVideoPlaying = true;
        }
    }
});