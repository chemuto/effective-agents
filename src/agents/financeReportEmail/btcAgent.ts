import { createClient } from "@supabase/supabase-js";

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
  };
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function fetchBTCPrice(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();
    const price = data.bitcoin.usd;

    // Store price in Supabase
    const { error } = await supabase.from("btc_price").insert([{ price }]);

    if (error) {
      console.error("Failed to store price in database:", error);
    }

    return price;
  } catch (error) {
    throw new Error(
      `Failed to fetch BTC price: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// For testing purposes
fetchBTCPrice().then((price) => {
  console.log(`The current BTC price is $${price}`);
});
