export { fundOverviewEM } from "./akshare/fund_overview_em";
import { fundOverviewEM } from "./akshare/fund_overview_em";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// 从请求 URL 中解析路径，用于路由分发
		const url = new URL(request.url);
		const { pathname } = url;

		// 新增基金概况接口（POST，批量）
		if (request.method === "POST") {
			let body: any = {};
			try {
				body = await request.json();
			} catch (e) {
				return Response.json({ error: "Invalid JSON body" }, { status: 400 });
			}
			if (
				body.p !== "fund_overview_em" ||
				!Array.isArray(body.symbols) ||
				body.symbols.length === 0
			) {
				return Response.json({ error: "Invalid p or symbols" }, { status: 400 });
			}
			const symbols: string[] = body.symbols;
			const results: any[] = [];
			const cache = new Map<string, any>();
			for (const symbol of symbols) {
				if (cache.has(symbol)) {
					const cached = cache.get(symbol);
					if (Array.isArray(cached)) {
						results.push(...cached);
					} else {
						results.push(cached);
					}
					continue;
				}
				try {
					const overview = await fundOverviewEM(symbol);
					const normalized = Array.isArray(overview) ? overview : [overview];
					cache.set(symbol, normalized);
					if (Array.isArray(overview)) {
						results.push(...overview);
					} else {
						results.push(overview);
					}
				} catch (e) {
					const errorResult = { error: String(e), symbol };
					cache.set(symbol, errorResult);
					results.push(errorResult);
				}
			}
			// 直接返回数组 JSON
			return new Response(
				JSON.stringify(results),
				{ headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		return new Response("p");
	},
} satisfies ExportedHandler<Env>;
