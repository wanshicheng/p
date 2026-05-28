
/**
 * Fetches the fund overview from Eastmoney (天天基金-基金档案-基本概况)
 * @param symbol 基金代码 (default: "015641")
 * @returns 基本概况对象数组（每个对象为一行，key为表头，value为内容）
 */
export async function fundOverviewEM(symbol: string = "015641"): Promise<Record<string, string>[]> {
    const url = `https://fundf10.eastmoney.com/jbgk_${symbol}.html`;
    const res = await fetch(url);
    const html = await res.text();

    // Use linkedom for HTML parsing (compatible with Workers and Node.js)
    // @ts-ignore
    const { DOMParser } = await import("linkedom");
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return [];
    const tables = doc.querySelectorAll("table");
    if (!tables.length) return [];
    const lastTable = tables[tables.length - 1];
    const rows = lastTable.querySelectorAll("tr");
    const result: Record<string, string> = {};
    rows.forEach((row, idx) => {
        // 选取所有 th 和 td
        const cells = Array.from(row.querySelectorAll("th,td"));
        for (let i = 0; i + 1 < cells.length; i += 2) {
            const key = cells[i].textContent?.trim() || "";
            const value = cells[i + 1].textContent?.trim() || "";
            result[key] = value;
        }
    });
    return [result];
}
