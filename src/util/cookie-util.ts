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

function getCSRF(): string {
    return getCookies()[CSRF_NAME];
}

export { getCookies, getCSRF };