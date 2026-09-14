function clearAllCookies() {
    document.cookie.split(";").forEach(cookie => {
        cookieStore.delete(cookie.split("=")[0]);
    });

    alert("All cookies has been cleared!");
}

function clearAllCookies() {
    document.cookie.split(";").forEach(function(cookie) {
        document.cookie = `${cookie.trim().split("=")[0]}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    });
}

function createCookie(cookie, data) {
    const date = new Date();

    document.cookie = `${cookie}=${data}; expires=${date.setTime(date.getTime() + 34_560_000_000).toString()}`;
}

function getCookie(cookie) {
    return document.cookie.split(";").find(value => value.trim().startsWith(cookie))?.split("=")?.[1];
}