function getKAID (): string {
	// Get KAID of current session by checking latest entry in localStorage

	// Get all KAID session entries + epoch date
	const kaids = localStorage["ka:4:mastery_accelerant_prompt"].match(/kaid_\d+/g);
	const dates = localStorage["ka:4:mastery_accelerant_prompt"].match(/:\d{13}\}/g);
	const combined = [];
	// Push into array with sortable format (by date)
	// Format: $Date$Kaid
	for (let i = 0; i < kaids.length; i += 1) {
			combined.push(dates[i] + kaids[i]);
	}
	combined.sort();

	// Return latest KAID
	return combined[combined.length-1].match(/kaid_\d+/g)[0];
}

export { getKAID };
