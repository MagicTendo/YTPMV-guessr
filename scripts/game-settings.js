const safeOption = document.getElementsByClassName("safe-option")[0];
const options = ["safe", "classic", "collab", "multisource", "sources-only", "songs-only", "max-rounds", "timer"];
const defaultValues = { "safe": true, "mode": "classic", "max-rounds": 5, "timer": 0 };
var workAmounts;

function initialiseModals() {
    const modalNames = ["settings", "how-to-play", "credits"];

    for (let i = 0; i < modalNames.length; i++) {
        const modal = document.getElementsByClassName(`${modalNames[i]}-modal`)[0];

        document.getElementsByClassName(`${modalNames[i]}-button`)[0].addEventListener("click", () => {
            modal.showModal();
        });

        document.getElementsByClassName(`${modalNames[i]}-close-button`)[0].addEventListener("click", () => {
            modal.close();
        });
    }
}

function getUserSettings() {
    const settings = ["safe", "mode", "max-rounds", "timer"];
    const userSettings = {};

    settings.forEach(setting => {
        userSettings[setting] = getCookie(setting) ?? defaultValues[setting];
    });

    return userSettings;
}

function updateAmounts() {
    for (let i = 1; i < options.length - 2; i++) {
        safeOption.checked ? document.getElementsByClassName(`${options[i]}-amount`)[0].innerText = workAmounts[`${options[i]}-safe`] : document.getElementsByClassName(`${options[i]}-amount`)[0].innerText = workAmounts[`${options[i]}-unsafe`];
    }
}

window.addEventListener("load", async () => {
    const selectedMode = getCookie("mode") ?? "classic";

    await fetch("./data/amounts.json")
        .then(response => response.json())
        .then(async amounts => {
            workAmounts = amounts;
        });

    options.forEach(option => {
        const currentOption = document.getElementsByClassName(`${option}-option`)[0];

        if (currentOption.type === "checkbox") {
            currentOption.addEventListener("change", async () => {
                createCookie(option, currentOption.checked);
                updateAmounts();
            });
        } else if (currentOption.type === "radio") {
            currentOption.addEventListener("change", async () => {
                createCookie("mode", option);
            });
        } else {
            currentOption.addEventListener("change", async () => {
                if (currentOption.checkValidity())
                    createCookie(option, currentOption.value);
                else
                    currentOption.value = defaultValues[option];
            });
        }

        if (currentOption.type === "checkbox") {
            currentOption.checked = getCookie(option) === "false" ? false : true;
        } else if (currentOption.type !== "radio") {
            if (!currentOption.checkValidity())
                currentOption.value = defaultValues[option];

            currentOption.value = getCookie(option) ?? defaultValues[option];
        }

        if (selectedMode === option)
            currentOption.checked = true;
    });

    initialiseModals();
    updateHighScore();
    updateAmounts();
}); 