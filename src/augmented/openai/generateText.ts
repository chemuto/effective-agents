import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function generateText() {
  const openai = new OpenAI();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Write a haiku about programming.",
        },
      ],
    });

    // Print only the content of the response
    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Call the function
generateText();
