export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", {
				status: 405,
				headers: { Allow: "POST" },
			});
		}

		let body: Record<string, unknown>;
		try {
			body = await request.json();
		} catch {
			return Response.json({ error: "Invalid JSON body" }, { status: 400 });
		}

		if (typeof body.url !== "string" || body.url.trim() === "") {
			return Response.json({ error: "Invalid url" }, { status: 400 });
		}

		if (typeof body.X !== "string") {
			return Response.json({ error: "Invalid X" }, { status: 400 });
		}

		const method = body.X.trim().toUpperCase();
		if (method !== "GET" && method !== "POST") {
			return Response.json(
				{ error: "Unsupported method, only GET and POST are allowed" },
				{ status: 400 }
			);
		}

		const init: RequestInit = { method };
		if (method === "POST") {

			if (body.d && typeof body.d === "object" && Object.keys(body.d).length > 0) {
				init.headers = { "content-type": "application/json; charset=utf-8" };
				init.body = JSON.stringify(body.d);   
			}
		}

		const upstreamResponse = await globalThis.fetch(body.url.trim(), init);
		return new Response(upstreamResponse.body, {
			status: upstreamResponse.status,
			statusText: upstreamResponse.statusText,
			headers: upstreamResponse.headers,
		});
	},
} satisfies ExportedHandler<Env>;
