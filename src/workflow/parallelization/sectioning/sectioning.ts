import OpenAI from "openai";

// Define types for clarity
type AgentResponse = {
  agentName: string;
  response: string | null;
};

async function agent1(prompt: string): Promise<AgentResponse> {
  const specificPrompt = `You are a factual analysis agent. Your role is to:
1. Identify and list the key facts and technical details from the question
2. Provide objective analysis based on concrete information
3. Focus on "what" and "how" aspects

Original question: ${prompt}

Provide your analysis in a clear, structured format.`;

  const response = await llmAgent(specificPrompt);
  console.log("Agent 1 (Factual Analysis) Response:", response);

  return {
    agentName: "FactualAnalysisAgent",
    response,
  };
}

async function agent2(prompt: string): Promise<AgentResponse> {
  const specificPrompt = `You are a contextual reasoning agent. Your role is to:
1. Consider broader implications and context
2. Identify potential challenges or considerations
3. Focus on "why" aspects and strategic implications
4. Suggest alternative approaches or considerations

Original question: ${prompt}

Provide your insights in a clear, structured format.`;

  const response = await llmAgent(specificPrompt);
  console.log("Agent 2 (Contextual Reasoning) Response:", response);

  return {
    agentName: "ContextualReasoningAgent",
    response,
  };
}

async function aggregatorAgent(
  responses: AgentResponse[],
  originalPrompt: string
): Promise<string | null> {
  const aggregationPrompt = `You are a synthesis agent. Your role is to create a comprehensive final answer by:
1. Combining the factual analysis and contextual insights provided
2. Resolving any potential contradictions
3. Creating a coherent, well-structured response
4. Ensuring all key points are addressed

Original question: ${originalPrompt}

Factual Analysis (Agent 1): ${responses[0].response}
Contextual Analysis (Agent 2): ${responses[1].response}

Provide a comprehensive final answer that synthesizes both perspectives into a clear, actionable response.`;

  const finalResponse = await llmAgent(aggregationPrompt);
  console.log("Final Aggregated Response:", finalResponse);
  return finalResponse;
}

async function parallelProcessing(prompt: string): Promise<string | null> {
  try {
    // Run first two agents in parallel
    const [agent1Response, agent2Response] = await Promise.all([
      agent1(prompt),
      agent2(prompt),
    ]);

    // Feed both responses to the aggregator
    const finalResponse = await aggregatorAgent(
      [agent1Response, agent2Response],
      prompt
    );

    return finalResponse;
  } catch (error) {
    console.error("Error in parallel processing:", error);
    return null;
  }
}

async function llmAgent(prompt: string) {
  const openai = new OpenAI();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Example execution
const examplePrompt =
  "What are the best practices for having a good night's sleep?";

console.log("Starting parallel processing with prompt:", examplePrompt);
console.log("----------------------------------------");

parallelProcessing(examplePrompt)
  .then((finalResult) => {
    console.log("----------------------------------------");
    console.log("Process completed successfully!");
  })
  .catch((error) => {
    console.error("Process failed:", error);
  });
