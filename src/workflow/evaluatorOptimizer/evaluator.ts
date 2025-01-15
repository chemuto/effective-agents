import { OpenAI } from "openai";

async function llmAgent(prompt: string, model: string = "gpt-4o") {
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

interface EvaluationResult {
  passed: boolean;
  feedback?: string;
}

interface WorkflowResult {
  finalResult: string;
  iterations: number;
  passed: boolean;
}

async function evaluateResult(
  result: string,
  criteria: string
): Promise<EvaluationResult> {
  console.log("\n🔍 Evaluating result...");
  console.log("Criteria:", criteria);

  const evaluationPrompt = `
    Please evaluate the following result against these criteria:
    ${criteria}

    Result to evaluate:
    ${result}

    Respond in JSON format:
    {
      "passed": boolean,
      "feedback": "detailed feedback if not passed, or 'approved' if passed"
    }
  `;

  const evaluation = await llmAgent(evaluationPrompt);
  try {
    const cleanJson = (evaluation || "[]")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanJson);
    console.log("📋 Evaluation result:", {
      passed: parsed.passed,
      feedback: parsed.feedback,
    });
    return parsed;
  } catch (error) {
    console.error("❌ Evaluation parsing error:", error);
    return { passed: false, feedback: "Failed to parse evaluation" };
  }
}

async function optimizeResult(
  currentResult: string,
  feedback: string,
  originalTask: string
): Promise<string> {
  console.log("\n🔄 Optimizing result...");
  console.log("Feedback being addressed:", feedback);

  const optimizationPrompt = `
    Original task: ${originalTask}
    
    Current result: ${currentResult}
    
    Feedback from evaluation: ${feedback}
    
    Please improve the result based on the feedback provided.
  `;

  const improvedResult = await llmAgent(optimizationPrompt);
  console.log("✨ Optimization complete");
  return improvedResult || currentResult;
}

async function runWorkflow({
  task,
  criteria,
  maxIterations = 3,
  currentResult = "",
}: {
  task: string;
  criteria: string;
  maxIterations?: number;
  currentResult?: string;
}): Promise<WorkflowResult> {
  console.log("\n🚀 Starting workflow");
  console.log("Task:", task);
  console.log("Max iterations:", maxIterations);

  if (!currentResult) {
    currentResult = (await llmAgent(task)) || "";
  }

  let iterations = 1;

  console.log("\n📝 Initial result:", currentResult);

  while (iterations < maxIterations) {
    console.log(`\n--- Iteration ${iterations}/${maxIterations} ---`);

    const evaluation = await evaluateResult(currentResult, criteria);

    if (evaluation.passed) {
      console.log("✅ Criteria met! Workflow complete");
      return {
        finalResult: currentResult,
        iterations,
        passed: true,
      };
    }

    currentResult = await optimizeResult(
      currentResult,
      evaluation.feedback || "",
      task
    );
    iterations++;
  }

  const finalEvaluation = await evaluateResult(currentResult, criteria);

  console.log(`\n🏁 Workflow finished after ${iterations} iterations`);
  console.log(
    "Final status:",
    finalEvaluation.passed ? "✅ Passed" : "❌ Did not pass"
  );

  return {
    finalResult: currentResult,
    iterations,
    passed: finalEvaluation.passed,
  };
}

const badEmail = `
  Dear [Recipient],

  I hope this email finds you well. I am writing to discuss a potential collaboration opportunity.

  [Your Message]

  Thank you for your time and consideration.

  Best regards,
  [Your Name]
`;

const result = await runWorkflow({
  task: "Write a professional email to schedule a meeting",
  criteria:
    "The email should be: 1. Professional 2. Clear about the purpose 3. Include a specific time proposal",
  currentResult: badEmail,
});

console.log(result);
