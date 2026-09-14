const totalYTPMV = document.getElementsByClassName("total-ytpmv")[0];
const safeOption = document.getElementsByClassName("safe-mode")[0];
const clearCookiesButton = document.getElementsByClassName("clear-cookies-button")[0];
const defaultValues = {};

let workAmounts;

function clearSettings() {
    Object.values(document.querySelectorAll(".option, .input")).forEach(option => {
        const defaultValue = option.dataset.default;

        if (option.type === "number")
            option.value = defaultValue;
        else
            option.checked = defaultValue === "true";
    });

    clearAllCookies();
}

function initialiseModals() {
    Object.values(document.getElementsByClassName("title-screen-buttons")[0].children).slice(1).forEach(button => {
        const modalName = button.className.replace("-button", "");
        const modal = document.getElementsByClassName(`${modalName}-modal`)[0];

        document.getElementsByClassName(`${modalName}-button`)[0].addEventListener("click", () => { modal.showModal(); });
        document.getElementsByClassName(`${modalName}-close-button`)[0].addEventListener("click", () => { modal.close(); });
    });
}

function getUserSetting(settingName) {
    const rawSetting = getCookie(settingName) ?? defaultValues[settingName];

    return settingName === "difficulty" ? rawSetting : isNaN(rawSetting) ? rawSetting === "true" : Number(rawSetting);
}