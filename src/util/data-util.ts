function getKAID (): string {
	// Get KAID from session
	const kaids = localStorage["ka:4:mastery_accelerant_prompt"].match(/kaid_\d+/g);
	const dates = localStorage["ka:4:mastery_accelerant_prompt"].match(/:\d{13}\}/g);
	const combined = [];
	for (let i = 0; i < kaids.length; i += 1) {
			combined.push(dates[i] + kaids[i]);
	}
	combined.sort();
	return combined[combined.length-1].match(/kaid_\d+/g)[0];
}

export { getKAID };
