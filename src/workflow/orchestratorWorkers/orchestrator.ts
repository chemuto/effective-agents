import OpenAI from "openai";

// Types for our workflow
type Task = {
  id: string;
  prompt: string;
};

type WorkerResult = {
  taskId: string;
  prompt: string;
  result: string;
};

async function llmAgent(prompt: string, model: string = "gpt-4o-mini") {
  const openai = new OpenAI();

  try {
    const completion = await openai.chat.completions.create({
      model: model,
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

// Main orchestrator functions
async function orchestrator(mainPrompt: string): Promise<string> {
  // 1. First, ask LLM to break down the task into subtasks
  const taskBreakdown = await llmAgent(
    `
    Break down the following task into smaller subtasks that can be executed in parallel.
    IMPORTANT: 
    - Each subtask MUST be independent and not rely on the results of other subtasks
    - Do not create sequential tasks (like "first do X, then do Y")
    - Each subtask should be self-contained and executable on its own
    
    Return a JSON array of subtasks, where each subtask has an "id" and a "prompt".
    Important: Return ONLY the JSON array, without any markdown formatting or backticks.
    
    Task: ${mainPrompt}
  `,
    "gpt-4o"
  );

  console.log("Task breakdown:", taskBreakdown);

  let tasks: Task[] = [];
  try {
    // Clean up the response by removing markdown formatting if present
    const cleanJson = (taskBreakdown || "[]")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    tasks = JSON.parse(cleanJson);
  } catch (error) {
    console.error("Failed to parse subtasks:", error);
    return "Failed to break down the task";
  }

  // 2. Execute all subtasks in parallel using workers
  const workerPromises = tasks.map((task) => worker(task));
  const results = await Promise.all(workerPromises);

  // 3. Synthesize results
  const synthesis = await synthesizeResults(results, mainPrompt);
  return synthesis;
}

// Worker function to handle individual subtasks
async function worker(task: Task): Promise<WorkerResult> {
  const result = await llmAgent(task.prompt);
  return {
    taskId: task.id,
    prompt: task.prompt,
    result: result || "Failed to process subtask",
  };
}

// Function to synthesize all results
async function synthesizeResults(
  results: WorkerResult[],
  originalPrompt: string
): Promise<string> {
  const resultsText = results
    .map(
      (r) => `Task ${r.taskId}:
Question: ${r.prompt}
Answer: ${r.result}`
    )
    .join("\n\n");

  const synthesis = await llmAgent(`
    Synthesize the following results into a coherent final answer.
    Original task: ${originalPrompt}
    
    Results:
    ${resultsText}
  `);

  return synthesis || "Failed to synthesize results";
}

// Example usage
async function runExample() {
  const mainPrompt =
    "Write a short blog post about the benefits of exercise, including both physical and mental health aspects.";

  //   const mainPrompt =
  //     "Create a healthy dinner recipe that's vegetarian, gluten-free, and high in protein. Include ingredients, instructions, nutritional analysis, and possible variations.";

  //   const mainPrompt = `Compare these three programming languages: Python, JavaScript, and Rust.
  //     Analyze each language independently across these aspects:
  //     - Learning curve
  //     - Performance characteristics
  //     - Main use cases
  //     - Job market demand
  //     - Community and ecosystem`;

  console.log("Starting orchestration...");
  const result = await orchestrator(mainPrompt);
  console.log("\nFinal Result:");
  console.log(result);
}

// Run the example
runExample().catch(console.error);
