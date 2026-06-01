import { fundOverviewEM } from "../src/akshare/fund_overview_em";
describe("fundOverviewEM", () => {
	it("fetches and parses fund overview for a known symbol", async () => {
		// Mock fetch to return a minimal HTML with a table structure similar to Eastmoney
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(`
				<html><body>
					<table><tr><td>忽略</td><td>忽略</td></tr></table>
					<table>
						<tr><td>基金名称</td><td>测试基金</td><td>基金代码</td><td>123456</td></tr>
						<tr><td>类型</td><td>混合型</td><td>管理人</td><td>测试公司</td></tr>
					</table>
				</body></html>
			`, { status: 200, headers: { "content-type": "text/html" } })
		);
		const result = await fundOverviewEM("123456");
		expect(result).toEqual([
			{
				"基金名称": "测试基金",
				"基金代码": "123456",
				"类型": "混合型",
				"管理人": "测试公司"
			}
		]);
	});
});
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

describe("Hello World worker", () => {
	it("responds with Hello World! (unit style)", async () => {
		const request = new IncomingRequest("http://example.com");
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it("responds with Hello World! (integration style)", async () => {
		const response = await SELF.fetch("https://example.com");
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it("rejects empty symbols for fund overview batch requests", async () => {
		const request = new IncomingRequest("http://example.com", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				p: "fund_overview_em",
				symbols: [],
			}),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Invalid p or symbols" });
	});

});
