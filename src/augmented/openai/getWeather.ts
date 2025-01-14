import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Schema for the weather function
const weatherTool = {
  type: "function" as const,
  function: {
    name: "get_weather",
    description: "Get current weather data for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City and country e.g. Paris, France",
        },
        units: {
          type: "string",
          enum: ["metric", "imperial", "standard"],
          description:
            "Units of measurement (metric: Celsius, imperial: Fahrenheit, standard: Kelvin)",
        },
      },
      required: ["location", "units"],
      additionalProperties: false,
    },
    strict: true,
  },
};

// Weather fetching function
async function getWeather(location: string, units: string = "metric") {
  const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

  if (!API_KEY) {
    throw new Error("OpenWeatherMap API key not found");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    location
  )}&units=${units}&appid=${API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.cod !== 200) {
    throw new Error(`Weather API error: ${data.message}`);
  }

  return {
    temperature: data.main.temp,
    feels_like: data.main.feels_like,
    humidity: data.main.humidity,
    description: data.weather[0].description,
    wind_speed: data.wind.speed,
  };
}

// Chat completion function that uses the weather tool
async function askAboutWeather() {
  const openai = new OpenAI();

  try {
    // Initial chat completion with the weather tool
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: "What's the weather like in Paris today?" },
      ],
      tools: [weatherTool],
    });

    // Get the tool calls from the response
    const toolCalls = completion.choices[0].message.tool_calls;

    if (toolCalls) {
      // Handle each tool call
      const messages = [completion.choices[0].message];

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === "get_weather") {
          const args = JSON.parse(toolCall.function.arguments);
          const weatherData = await getWeather(args.location, args.units);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(weatherData),
          });
        }
      }

      // Get final response incorporating weather data
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [...messages],
      });

      console.log(finalResponse.choices[0].message.content);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Call the function
askAboutWeather();
