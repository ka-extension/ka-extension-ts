import { anyFunc } from "../types/data";

// TS Promise-based utility functions for finding JS generated elements on a page
function querySelectorAllPromise (selectorString: string, interval: number = 250, maxTrials?: number): Promise<NodeListOf<Element>> {
	return new Promise((resolve: (nodes: NodeListOf<Element>) => void, reject: anyFunc): void => {
		let i: number = 0;
		(function find (): void {
			const elements = document.querySelectorAll(selectorString);

			if (elements.length > 0) {
				resolve(elements);
			} else if (maxTrials !== undefined && i > maxTrials) {
				reject(new Error(`Could not find ${selectorString}`));
			} else {
				i++;
				setTimeout(find, interval);
			}
		})();
	});
}

function querySelectorPromise (elementString: string, interval: number = 250, maxTrials?: number): Promise<Element> {
	return new Promise((resolve: (node: Element) => void, reject: anyFunc): void => {
		let i = 0;
		(function find (): void {
			const element = document.querySelector(elementString);
			if (element) {
				resolve(element);
			} else if (maxTrials && i > maxTrials) {
				reject(new Error(`Could not find ${elementString}`));
			} else {
				i++;
				setTimeout(find, interval);
			}
		})();
	});
}

function objectNotEmptyTimer (obj: object, interval: number = 100): Promise<object> {
	return new Promise((resolve: (obj: object) => void, reject: anyFunc) => {
		(function check (): void {
			if (typeof obj !== "object") { reject(new TypeError(`${obj} is not an object`)); }
			else if (Object.keys(obj).length === 0) { setTimeout(check, interval); }
			else { resolve(obj); }
		})();
	});
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export { querySelectorAllPromise, querySelectorPromise, objectNotEmptyTimer, wait };
