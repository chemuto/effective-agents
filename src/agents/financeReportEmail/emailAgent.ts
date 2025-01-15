import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import Mailjet from "node-mailjet";
import { createCanvas } from "@napi-rs/canvas";
import { Chart } from "chart.js/auto";

const recipientName = process.env.RECIPIENT_NAME!;
const recipientEmail = process.env.RECIPIENT_EMAIL!;

export class EmailAgent {
  private openai: OpenAI;
  private supabase;
  private mailjet;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    this.mailjet = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY!,
      apiSecret: process.env.MAILJET_API_SECRET!,
    });
  }

  private async getLatestData() {
    // Get latest news
    const { data: newsData, error: newsError } = await this.supabase
      .from("eco_news")
      .select("finance_info")
      .order("created_at", { ascending: false })
      .limit(10);

    if (newsError) throw newsError;

    // Get BTC price data for the last 7 days
    const { data: btcData, error: btcError } = await this.supabase
      .from("btc_price")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(7);

    if (btcError) throw btcError;

    return {
      news: newsData.map((item) => JSON.parse(item.finance_info)),
      btcPrice: btcData[0],
      btcPrices: btcData.reverse(),
    };
  }

  private async generateEmailContent(context: any) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional financial analyst. Write a very concise email analyzing the latest market events and Bitcoin price movements. Focus on key correlations and important insights. Keep it short and professional.",
        },
        {
          role: "user",
          content: `Latest data: ${JSON.stringify(
            context
          )}. Write a short, professional analysis email for ${recipientName}.`,
        },
      ],
    });

    return completion.choices[0].message.content;
  }

  private async generatePriceChart(btcPrices: any[]) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext("2d");

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: btcPrices.map((price) =>
          new Date(price.created_at).toLocaleDateString()
        ),
        datasets: [
          {
            label: "Bitcoin Price (USD)",
            data: btcPrices.map((price) => price.price),
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: "Bitcoin Price Trend",
          },
        },
      },
    });

    // Render the chart
    await chart.draw();

    // Convert to PNG buffer
    const imageBuffer = canvas.toBuffer("image/png");

    // Clean up
    chart.destroy();

    return imageBuffer;
  }

  private async sendEmail(content: string, chartBuffer: Buffer) {
    const data = {
      Messages: [
        {
          From: {
            Email: process.env.SENDER_EMAIL!,
            Name: "Finance Bot",
          },
          To: [
            {
              Email: recipientEmail,
              Name: recipientName,
            },
          ],
          Subject: "Daily Financial Market Update",
          TextPart: content,
          HTMLPart: content.replace(/\n/g, "<br>"),
          Attachments: [
            {
              ContentType: "image/png",
              Filename: "bitcoin-price-trend.png",
              Base64Content: chartBuffer.toString("base64"),
            },
          ],
        },
      ],
    };

    try {
      await this.mailjet.post("send", { version: "v3.1" }).request(data);
      console.log("✉️ Email sent successfully");
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw error;
    }
  }

  async analyzeAndSendUpdate() {
    try {
      console.log("🤖 Starting financial analysis process...");

      // Get latest data from both tables
      const context = await this.getLatestData();
      console.log("📊 Retrieved latest market data");

      // Generate price chart
      const chartBuffer = await this.generatePriceChart(context.btcPrices);
      console.log("📈 Generated price chart");

      // Generate email content using OpenAI
      const emailContent = await this.generateEmailContent(context);
      console.log("✍️ Generated analysis content");

      // Send email using Mailjet
      await this.sendEmail(emailContent, chartBuffer);

      return true;
    } catch (error) {
      console.error("❌ Error in analyzeAndSendUpdate:", error);
      throw error;
    }
  }
}

// Usage
const emailAgent = new EmailAgent();
emailAgent.analyzeAndSendUpdate();
