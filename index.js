import OpenAI from "openai";
import { exec } from "node:child_process";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY");
}

const openai = new OpenAI({
  apiKey: GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const SYSTEM_PROMPT = `You are a helpful AI assistant who is designed to resolve user query, 
    if you think, user query needs a tool invocationm just tell me the tool name with parameters 
    You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode 

    In the start pahse, user gives a query to you . 
    Then, you THINK how to resolve that query atleast 3-4 times and make sure that 
    If there is a need to call a tool, you cal a ACTION event with tool and input 
    If ther is and action call, wait for the OBSERVE that is output of the tool
    Based onthe OBSERVE from prev step, you either output or repeat the loop 

    Rules:
    - Always wait for next step.
    - Always output a single ste and wait for the next step. 
    - Output must be strictly JSON
    - Only call tool action from Available Tools
    - Strictly follow output format inJSON
    
    Available Tools
         - getWeatherInfo(city: string): string
         - executeCommand(command): string) Execute the given command on user;s device and return the stdout and stderr

    Example: 
    START: What is weather of Bengaluru? 
    THINK: The user is asking for the weather of bengaluru 
    THINK: From the available tools, I must call getWeatherInfo tool for Bengaluru as input 
    ACTION: Call Tool getWeatherInfo(Bengaluru)
    OBSERVE: 32 Degree C
    THINK: The output of getWeatherInfo is 32 Degree C 
    OUTPUT: The weather of Bengaluru is 32 Degree C which is quite hot🥵

    Output Example: 
    { "role": "user", "content": "what is weather of Bengaluru?"}
    { "step": "think", "content": "The user is asking for the weather of bengaluru "}
    { "step": "think", "content": "From the available tools, I must call getWeatherInfo tool for Bengaluru as input "}
    { "step": "action", "content": "Call Tool getWeatherInfo", input: Bengaluru}
    { "step": "observe", "content": "32 Degree C"}
    { "step": "think", "content": "The output of getWeatherInfo is 32 Degree C which is quite hot🥵"}
    { "step": "output", "content": "The output of getWeatherInfo is 32 Degree C which is quite hot🥵"}
    
    Output Format: 
    { "step": "string", "tool": "string", "input": "string", "content": "string"}
     `;

function getWeatherInfo(cityName) {
  return `This city ${cityName} has a temperature of 42 Degree C which is quite hot🥵`;
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, function (error, stdout, stderr) {
      if (error) {
        reject(error);
      }
      resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
    });
  });
}

const TOOLS_MAP = {
  getWeatherInfo,
  executeCommand,
};

async function init() {
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];
  const userQuery = "What is indside my package.json file";
  messages.push({ role: "user", content: userQuery });

  while (true) {
    const response = await openai.chat.completions.create({
      model: "gemini-2.5-pro",
      response_format: { type: "json_object" },
      messages: messages,
    });
    messages.push({
      role: "assistant",
      content: response.choices[0].message.content,
    });
    const parsedResponse = JSON.parse(response.choices[0].message.content);

    if (parsedResponse.step && parsedResponse.step === "think") {
      console.log(`🧠: ${parsedResponse.content}`);
      continue;
    }
    if (parsedResponse.step && parsedResponse.step === "output") {
      console.log(`🤖: ${parsedResponse.content}`);
      break;
    }
    if (parsedResponse.step && parsedResponse.step === "action") {
      const tool = parsedResponse.tool;
      const input = parsedResponse.input;

      console.log(`🔨: Tool call ${tool}: ${input}`);

      console.log(`🤖: ${parsedResponse.content}`);
      const value = await TOOLS_MAP[tool](input);
      messages.push({
        role: "assistant",
        content: JSON.stringify({ step: "observe", content: value }),
      });
      continue;
    }
  }
}
init();
