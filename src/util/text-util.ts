function HTMLtoKAMarkdown (html: string): string {
	return html
		.replace(/<pre>\s*<code>([.\s\S]*?)<\/code>\s*<\/pre>/ig, (match, one) =>  "```\n" + one + "\n```")
		.replace(/<code>(.*?)<\/code>/ig, (match, one) => "`" + one + "`")
		.replace(/<b>(.*?)<\/b>/ig, (match, one) => `*${one}*`)
		.replace(/<em>(.*?)<\/em>/ig, (match, one) => `_${one}_`)
		.replace(/<a.*?>(.*?)<\/a>/ig, (match, one) => one)
		.replace(/<br(?:\s*\/\s*)?>/ig, () => `\n`);
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
	for(const i in params) {
		ret += `${encodeURIComponent(i)}=${encodeURIComponent(params[i] + "") + (v++ !== Object.keys(params).length - 1 ? "&" : "")}`;
	}
	return ret;
}

function formatDate (date: string): string {
	const d: Date = new Date(date);
	return `${("0" + (d.getMonth() + 1)).slice(-2)}/${("0" + d.getDate()).slice(-2)}/${d.getFullYear()} ${("0" + d.getHours()).slice(-2)}:${("0" + d.getMinutes()).slice(-2)}`;
}

const specialChars: { [item: string]: string } = {
	"&": "&amp;",
	"\"": "&quot;",
	"'": "&apos;",
	"<": "&lt;",
	">": "&gt;"
};

function escapeHTML (str: string): string | null {
	return str.replace(/[&"'<>]/g, (char: string) => specialChars[char]);
}

export { HTMLtoKAMarkdown, KAMarkdowntoHTML, buildQuery, formatDate, escapeHTML };
