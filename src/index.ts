export { fundOverviewEM } from "./akshare/fund_overview_em";
import { yfinance } from "./yfinance";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// 从请求 URL 中解析路径，用于路由分发
		const url = new URL(request.url);
		const { pathname, searchParams } = url;

		if (pathname === "/yfinance") {
			return Response.json({
				provider: "yfinance",
				endpoints: ["/yfinance/quote"],
			});
		}

		if (pathname === "/yfinance/quote") {
			try {
				const quote = await yfinance.quote("GC=F");

				return Response.json({
					provider: "yfinance",
					asset: "london-gold",
					symbol: quote.symbol,
					price: quote.price,
					currency: quote.currency,
					marketTime: quote.marketTime,
					source: quote.source,
				});
			} catch {
				return Response.json(
					{ error: "Unable to retrieve london gold data" },
					{ status: 502 },
				);
			}
		}

		// 新增基金概况接口（POST，批量）
		if (request.method === "POST") {
			let body: any = {};
			try {
				body = await request.json();
			} catch (e) {
				return Response.json({ error: "Invalid JSON body" }, { status: 400 });
			}
			if (body.p !== "fund_overview_em" || !Array.isArray(body.symbols)) {
				return Response.json({ error: "Invalid p or symbols" }, { status: 400 });
			}
			const { fundOverviewEM } = await import("./akshare/fund_overview_em");
			const symbols: string[] = body.symbols;
			const results: any[] = [];
			for (const symbol of symbols) {
				try {
					const overview = await fundOverviewEM(symbol);
					if (Array.isArray(overview)) {
						results.push(...overview);
					} else {
						results.push(overview);
					}
				} catch (e) {
					results.push({ error: String(e), symbol });
				}
			}
			// 打印到控制台
			console.log("fundOverviewEM batch result:", results);
			// 直接返回数组 JSON
			return new Response(
				JSON.stringify(results),
				{ headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		return new Response("p");
	},
} satisfies ExportedHandler<Env>;
