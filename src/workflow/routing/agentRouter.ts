import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/*
 * The router agent is to send the user input to the correct agent
 */
async function routerAgent(prompt: string) {
  const openai = new OpenAI();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a router agent. Your only job is to decide which agent should handle the user's input.
          Simply respond with either "reasoning" or "conversational" based on these rules:
          
          - Response should be "reasoning" if:
            * The query requires extensive reasoning
            * The query involves math or coding
          - Response should be "conversational" if:
            * The query needs a simple answer
            * The query is casual conversation
          
          Respond with only one word: either "reasoning" or "conversational"`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return completion.choices[0].message.content || "conversational";
  } catch (error) {
    console.error("Error:", error);
    return "conversational"; // Default fallback
  }
}

async function reasoningAgent(prompt: string) {
  const openai = new OpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a reasoning agent that can help the user with their questions.`,
      },
      { role: "user", content: prompt },
    ],
  });

  return completion.choices[0].message.content;
}

async function conversationalAgent(prompt: string) {
  const openai = new OpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a conversational agent that can help the user with their questions.`,
      },
      { role: "user", content: prompt },
    ],
  });

  return completion.choices[0].message.content;
}

async function handleUserInput(prompt: string) {
  // First, determine which agent should handle the request
  const agentType = await routerAgent(prompt);

  console.log("Agent type: ", agentType);

  // Route to the appropriate agent and return their response
  if (agentType.toLowerCase().includes("reasoning")) {
    return reasoningAgent(prompt);
  } else {
    return conversationalAgent(prompt);
  }
}

const prompt = "Write a python script to calculate the sum of two numbers";
const response = await handleUserInput(prompt);
console.log("Response: ", response);
