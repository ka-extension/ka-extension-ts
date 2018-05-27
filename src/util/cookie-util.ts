import { CSRF_NAME } from "../names";

function getCookies(): { [name: string]: string; } {
    const cookies: { [name: string]: string; } = {};
    const pairs: string[][] = document.cookie.split(";")
        .map((e: string): string[] => e.split(/=(.+)/)
        .filter((e: string): boolean => e.length > 0)
        .map((e: string): string => decodeURIComponent(e.trim())))
    pairs.forEach((e: string[]): void => void(cookies[e[0]] = e[1]));
    return cookies;
}

function getChromeCookies(): string {
    let cookies = chrome.cookies.getAll({}, cookies => {
        return cookies.filter((c, i, arr) => {
            return c.name !== "fonts-loaded-lato";
        });
    });
    return JSON.stringify(cookies);
};

function getCSRF(): string {
    return getCookies()[CSRF_NAME];
}

function getChromeFkey(): Promise<{}> {
    let cookiePromise = new Promise((resolve, reject) => {
        chrome.cookies.get({
            url: "https://www.khanacademy.org",
            name: "fkey"
        }, cookie => {
            if (cookie == null || !cookie) reject("Fkey cookie not found.")
            resolve(cookie!.value);
        });
    });
    return cookiePromise;
};

export { getCookies, getChromeCookies, getCSRF, getChromeFkey };
