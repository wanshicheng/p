import { ofetch } from "ofetch";

export type QuoteResult = {
	symbol: string;
	currency: string;
	price: number | null;
	marketTime: number | null;
	source: string;
};

type YahooChartPayload = {
	chart?: {
		result?: Array<{
			meta?: {
				symbol?: string;
				currency?: string;
				regularMarketPrice?: number;
				regularMarketTime?: number;
			};
			indicators?: {
				quote?: Array<{
					close?: Array<number | null>;
				}>;
			};
		}>;
	};
};

export class YFinanceClient {
	async quote(symbol: string): Promise<QuoteResult> {
		const payload = await ofetch<YahooChartPayload>(
			`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`,
		);

		const result = payload.chart?.result?.[0];
		if (!result?.meta) {
			throw new Error("Unexpected upstream payload shape");
		}

		const closes = result.indicators?.quote?.[0]?.close ?? [];
		const latestClose = closes.findLast((value) => value != null) ?? null;

		return {
			symbol: result.meta.symbol ?? symbol,
			currency: result.meta.currency ?? "USD",
			price: result.meta.regularMarketPrice ?? latestClose,
			marketTime: result.meta.regularMarketTime ?? null,
			source: "ofetch:yahoo-finance-chart",
		};
	}
}

export const yfinance = new YFinanceClient();
