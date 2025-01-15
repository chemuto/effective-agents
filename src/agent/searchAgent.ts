import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export class SearchAgent {
  private openai: OpenAI;
  private braveApiKey: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.braveApiKey = process.env.BRAVE_API_KEY!;
  }

  private async searchBraveNews(query: string) {
    console.log(`🔎 Searching Brave News for query: "${query}"`);

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
      )}&count=5`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.braveApiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Brave Search API error: ${response.statusText}`);
      throw new Error(`Brave Search API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract only essential information from each result
    const processedResults =
      data.web?.results?.map((result: any) => ({
        title: result.title,
        description: result.description,
        url: result.url,
        published: result.published_time,
      })) || [];

    console.log(`📰 Found ${processedResults.length} news articles`);
    return processedResults;
  }

  private async storeNewsInDatabase(news: any[]) {
    // Create an array of rows, one for each news article
    const rows = news.map((article) => ({
      finance_info: JSON.stringify(article), // Store each article separately
    }));

    const { error } = await supabase.from("eco_news").insert(rows);

    if (error) throw error;
  }

  async findAndStoreNews() {
    console.log("🤖 Starting news search and analysis process...");

    const tools = [
      {
        type: "function",
        function: {
          name: "search_news",
          description:
            "Search for latest news, including finance and crypto news",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query for news",
              },
            },
            required: ["query"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    ];

    try {
      // First search: Crypto/Bitcoin
      console.log("🧠 Asking GPT to generate crypto search query...");
      const cryptoCompletion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Find the latest important cryptocurrency and Bitcoin news. Generate a search query that will help find relevant recent news. Time now is ${new Date().toISOString()}.`,
          },
        ],
        tools: tools,
      });

      // Second search: General Finance/Macro
      console.log("🧠 Asking GPT to generate finance search query...");
      const financeCompletion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Find the latest important finance and macroeconomic news. Generate a search query that will help find relevant recent news. Time now is ${new Date().toISOString()}.`,
          },
        ],
        tools: tools,
      });

      const cryptoToolCall =
        cryptoCompletion.choices[0].message.tool_calls?.[0];
      const financeToolCall =
        financeCompletion.choices[0].message.tool_calls?.[0];

      if (!cryptoToolCall || !financeToolCall) {
        console.error("❌ No tool call received from OpenAI");
        throw new Error("No tool call received from OpenAI");
      }

      // Parse both search queries
      const { query: cryptoQuery } = JSON.parse(
        cryptoToolCall.function.arguments
      );
      const { query: financeQuery } = JSON.parse(
        financeToolCall.function.arguments
      );

      console.log(`🔍 Generated crypto search query: "${cryptoQuery}"`);
      console.log(`🔍 Generated finance search query: "${financeQuery}"`);

      // Perform both searches
      const cryptoResults = await this.searchBraveNews(cryptoQuery);
      // Add delay to respect rate limits
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      await delay(1100); // Wait 1.1 seconds before making the request
      const financeResults = await this.searchBraveNews(financeQuery);

      // Combine results and store them
      const allResults = [...cryptoResults, ...financeResults];

      console.log("💾 Storing news articles in database...");
      await this.storeNewsInDatabase(allResults);
      console.log("✅ News articles stored successfully");
      console.log("\n📝 Stored articles:", allResults.length);

      return allResults;
    } catch (error) {
      console.error("❌ Error in findAndStoreNews:", error);
      throw error;
    }
  }
}

const searchAgent = new SearchAgent();
searchAgent.findAndStoreNews();
