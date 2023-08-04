// Returns undefined if run before the page has fully loaded
function getKAID (): string|undefined {
	for (const key in window.__APOLLO_CLIENT__?.cache?.data?.data) {
		if (key.startsWith("User:kaid_")) {
			return key.substring("User:".length);
		}
	}
}

export { getKAID };
