function handler(event) {
	const request = event.request;
	const uri = request.uri;

	// Skip rewrite if file extension is present (e.g., .css, .png, .html)
	if (uri.match(/\.[a-zA-Z0-9\-_\.]+$/)) {
		return request;
	}

	// Rewrite /fr/ or /fr/services/ to /fr/index.html
	if (uri.startsWith("/fr/")) {
		request.uri = "/fr/index.html";
	} else {
		request.uri = "/index.html";
	}

	return request;
}
