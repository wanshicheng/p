export { fundOverviewEM } from "./akshare/fund_overview_em";
import { fundOverviewEM } from "./akshare/fund_overview_em";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// 新增基金概况接口（POST，单个）
		if (request.method === "POST") {
			let body: any = {};
			try {
				body = await request.json();
			} catch (e) {
				return Response.json({ error: "Invalid JSON body" }, { status: 400 });
			}
			if (
				body.p !== "fund_overview_em" ||
				typeof body.symbol !== "string" ||
				body.symbol.trim() === ""
			) {
				return Response.json({ error: "Invalid p or symbol" }, { status: 400 });
			}
			const symbol: string = body.symbol;
			try {
				const overview = await fundOverviewEM(symbol);
				const result = Array.isArray(overview) ? overview[0] : overview;
				return new Response(JSON.stringify(result), {
					headers: { "content-type": "application/json; charset=utf-8" },
				});
			} catch (e) {
				return Response.json({ error: String(e), symbol }, { status: 500 });
			}
		}

		return new Response("p");
	},
} satisfies ExportedHandler<Env>;
