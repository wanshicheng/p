import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect, vi, afterEach } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

afterEach(() => {
	vi.restoreAllMocks();
});

describe("body-driven proxy worker", () => {
	it("forwards GET requests to the url in the body", async () => {
		const upstreamFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("ok", {
				status: 200,
				headers: { "content-type": "text/plain; charset=utf-8" },
			})
		);

		const request = new IncomingRequest("http://example.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				url: "https://upstream.example/get",
				X: "GET",
			}),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(upstreamFetch).toHaveBeenCalledWith("https://upstream.example/get", {
			method: "GET",
		});
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("ok");
	});

	it("forwards POST requests with the remaining body payload", async () => {
		const upstreamFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("created", {
				status: 201,
				headers: { "content-type": "text/plain; charset=utf-8" },
			})
		);

		const request = new IncomingRequest("http://example.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				url: "https://upstream.example/post",
				X: "POST",
				foo: "bar",
			}),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(upstreamFetch).toHaveBeenCalledWith("https://upstream.example/post", {
			method: "POST",
			headers: { "content-type": "application/json; charset=utf-8" },
			body: JSON.stringify({ foo: "bar" }),
		});
		expect(response.status).toBe(201);
		expect(await response.text()).toBe("created");
	});

	it("rejects unsupported methods in the body", async () => {
		const request = new IncomingRequest("http://example.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				url: "https://upstream.example/delete",
				X: "DELETE",
			}),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "Unsupported method, only GET and POST are allowed",
		});
	});
});
