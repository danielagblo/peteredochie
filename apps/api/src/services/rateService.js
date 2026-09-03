const API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_TTL = 5 * 60 * 1000;

let cached = null;

// Returns how many units of `targetCurrency` equal 1 USD, using a live rate
// with a short in-memory cache. Used to convert USD-denominated prices into
// the merchant's local Paystack currency (e.g. GHS) before charging.
export async function getUsdRate(targetCurrency) {
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		const r = cached.rates[targetCurrency];
		if (!r) throw new Error(`Rate for ${targetCurrency} not found in cache`);
		return r;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);

	let res;
	try {
		res = await fetch(API_URL, { signal: controller.signal });
	} catch (err) {
		clearTimeout(timeout);
		throw new Error(`Failed to fetch exchange rate: ${err.message}`);
	}
	clearTimeout(timeout);

	if (!res.ok) throw new Error('Failed to fetch exchange rate');

	const data = await res.json();
	const rate = data.rates && data.rates[targetCurrency];
	if (!rate) throw new Error(`Rate for ${targetCurrency} not found in response`);

	cached = { rates: data.rates, timestamp: Date.now() };
	return rate;
}
