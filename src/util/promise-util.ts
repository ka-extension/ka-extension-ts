// TS Promise-based utility functions for finding JS generated elements on a page
function querySelectorAllPromise (selectorString: string, interval: number = 250, maxTrials?: number): Promise<NodeList> {
	return new Promise((resolve: (nodes: NodeList) => void, reject: (...args: any[]) => void): void => {
		let i: number = 0;
		(function find (): void {
			const elements: NodeList = document.querySelectorAll(selectorString);
			if (maxTrials !== undefined && i > maxTrials) { reject(new Error(`Could not find ${selectorString}`)); }
			else if (elements.length === 0) { setTimeout(find, interval); }
			else { resolve(elements); }
			i++;
		})();
	});
}

function querySelectorPromise (elementString: string, interval: number = 250, maxTrials?: number): Promise<Node> {
	return querySelectorAllPromise(elementString, interval, maxTrials).then((e: NodeList): Node => e[0]);
}

function objectNotEmptyTimer (obj: object, interval: number = 100): Promise<object> {
	return new Promise((resolve: (obj: object) => void, reject: (...args: any[]) => void) => {
		(function check (): void {
			if (typeof obj !== "object") { reject(new TypeError(`${obj} is not an object`)); }
			else if (Object.keys(obj).length === 0) { setTimeout(check, interval); }
			else { resolve(obj); }
		})();
	});
}

export { querySelectorAllPromise, querySelectorPromise, objectNotEmptyTimer };
