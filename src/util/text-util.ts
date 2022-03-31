import {DATE_FORMATTER, TIME_PERIODS} from "../types/names";

function HTMLtoKAMarkdown (html: string): string {
	return html
		.replace(/<pre>\s*<code>([.\s\S]*?)<\/code>\s*<\/pre>/ig, (match, one) => "```\n" + one + "\n```")
		.replace(/<code>(.*?)<\/code>/ig, (match, one) => "`" + one + "`")
		.replace(/<b>(.*?)<\/b>/ig, (match, one) => `*${one}*`)
		.replace(/<em>(.*?)<\/em>/ig, (match, one) => `_${one}_`)
		.replace(/<a.*?>(.*?)<\/a>/ig, (match, one) => one)
		.replace(/<br(?:\s*\/\s*)?>/ig, () => "\n");
}

function KAMarkdowntoHTML (markdown: string): string {
	return markdown
		.replace(/\`\`\`\s*([.\s\S]*?)\s*\`\`\`/ig, (_, one) => `<pre><code>${one}</code></pre>`)
		.replace(/\`(.+?)\`/ig, (_, one) => `<code>${one}</code>`)
		.replace(/\*(.+?)\*/ig, (_, one) => `<b>${one}</b>`)
		.replace(/_(.+?)_/ig, (_, one) => `<em>${one}</em>`)
		.replace(/\n/ig, () => "<br />");
}

function buildQuery (params: { [key: string]: string }): string {
	let ret: string = "";
	let v: number = 0;
	for (const i in params) {
		ret += `${encodeURIComponent(i)}=${encodeURIComponent(params[i] + "") + (v++ !== Object.keys(params).length - 1 ? "&" : "")}`;
	}
	return ret;
}

function parseQuery (queryString: string): {[key: string]: string} {
	const params: {[key: string]: string} = {};
	const queries = queryString.split("&");
	for (const query of queries) {
		console.log(query);
		const temp = decodeURIComponent(query).split("=");
		params[temp[0]] = temp[1];
	}
	return params;
}

function formatDate (date: string): string {
	const d: Date = new Date(date);
	return `${("0" + (d.getMonth() + 1)).slice(-2)}/${("0" + d.getDate()).slice(-2)}/${d.getFullYear()} ${("0" + d.getHours()).slice(-2)}:${("0" + d.getMinutes()).slice(-2)}`;
}

function relativeDate (str: string): string {
	if (DATE_FORMATTER === undefined) {
		return formatDate(str);
	}

	const date = new Date(str);
	const now = new Date();

	const elapsed = date.getTime() - now.getTime();

	for (const [unit, period] of Object.entries(TIME_PERIODS)) {
		if (-elapsed > period || unit === "second") {
			return DATE_FORMATTER.format(Math.round(elapsed / period), (unit as Intl.RelativeTimeFormatUnit));
		}
	}

	return formatDate(str);
}

function urlUnencode (str: string): { [name: string]: string[]; } {
	const params: { [name: string]: string[]; } = {};
	const pairs: string[][] = str.split("&")
		.map((e: string): string[] => e.split(/=(.+)/)
			.filter((e: string): boolean => e.length > 0)
			.map((e: string): string => decodeURIComponent(e.trim())));
	pairs.forEach((e: string[]): void => void (params[e.shift() + ""] = e[0].split(",")));
	return params;
}

const specialChars: { [item: string]: string } = {
	"&": "&amp;",
	"\"": "&quot;",
	"'": "&apos;",
	"<": "&lt;",
	">": "&gt;"
};

function escapeHTML (str: string): string {
	return str.replace(/[&"'<>]/g, (char: string) => specialChars[char] || "");
}

function guessLanguage (code: string): string {
	let language = "";

	if (code.trim().charAt(0) === "<") {
		language = "html";
	} else {
		// split code at open curly bracket
		const braceSplit = code.split("{");
		let isCSS: boolean;

		// if there is an open curly bracket then continue
		if (braceSplit.length > 1) {
			// if the code before the open curly bracket has quotes
			if (braceSplit[0].includes("\"") || braceSplit[0].includes("'")) {
				// then it's not CSS
				isCSS = false;
			}
			// otherwise
			else {
				// split the code after open curly bracket at colon
				const colonSplit = braceSplit[1].split(":");
				// if the code after the colon exists then continue
				if (colonSplit.length > 1) {
					// get the code between the colon and the semicolon
					const afterColon = colonSplit[1].split(";")[0];
					// if the number of quatation marks in the slice of code is even
					if (afterColon.split("\"").length - 1 % 2 === 0 && afterColon.split("'").length - 1 % 2 === 0) {
						// then it is CSS
						isCSS = true;
					} else {
						// otherwise it's not CSS
						isCSS = false;
					}
				}
				// otherwise it's not CSS
				else {
					isCSS = false;
				}
			}
		}
		// otherwise it's not CSS
		else {
			isCSS = false;
		}

		if (isCSS) {
			language = "css";
		} else {
			language = "javascript";
		}
	}
	return language;
}

export {
	HTMLtoKAMarkdown, KAMarkdowntoHTML, buildQuery, parseQuery,
	formatDate, relativeDate, escapeHTML, urlUnencode, guessLanguage
};
