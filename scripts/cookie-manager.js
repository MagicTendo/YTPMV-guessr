function createCookie(cookie, data) {
    const date = new Date();

    document.cookie = `${cookie}=${data}; expires=${date.setTime(date.getTime() + 34_560_000_000).toString()}`;
}

function getCookie(cookie) {
    return document.cookie.split(";").find(value => value.trim().startsWith(cookie))?.split("=")?.[1];
}