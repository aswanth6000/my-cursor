# 🧠 Building Your Own Cursor-like AI IDE Agent

This project simulates the behavior of a **local-first, AI-native IDE assistant**, inspired by tools like [Cursor](https://www.cursor.sh/), but built from scratch using:

* 🤖 **Gemini or OpenAI-compatible model**
* 🧩 **Tool use architecture** (e.g., run terminal commands)
* 📡 **Structured reasoning** (think → act → observe → respond)
* 🔁 **Multi-turn interaction loop**

---

## ✨ What You're Building

An **AI co-pilot inside your terminal/editor** that behaves like a developer assistant:

* Understands natural language queries
* Thinks before acting
* Uses real tools (like shell commands or APIs)
* Shows intermediate steps (like thoughts, decisions, and observations)
* Logs everything in **structured JSON**

This is the backbone of an **AI-native IDE**.

---

## 🏗️ Internal Architecture

```
+----------------------------+
|      User Input Query      |
+------------+---------------+
             |
             v
+----------------------------+
|       SYSTEM PROMPT        |  <- Defines reasoning framework: START, THINK, ACTION...
+----------------------------+
             |
             v
+----------------------------+
|   AI Agent (Gemini/OpenAI) |  <- Receives full conversation context
+----------------------------+
             |
     JSON Structured Response
             |
      ┌──────┴──────┐
      v             v
 [THINK]       [ACTION → TOOL CALL]
                    |
                    v
           +---------------------+
           |  Tool Implementation|
           | (exec, APIs, etc.)  |
           +---------------------+
                    |
              [OBSERVE → Response]
                    |
                    v
             [Final Output to User]
```

---

## 🔁 Reasoning Flow: Agent Workflow

| Step    | Description                                            |
| ------- | ------------------------------------------------------ |
| START   | User gives a query                                     |
| THINK   | Agent evaluates multiple ideas on how to solve it      |
| ACTION  | If needed, agent calls a tool using structured input   |
| OBSERVE | Result from tool (e.g., terminal output or API result) |
| OUTPUT  | Final answer to user, based on observation             |

---

## 💻 Code Highlights

### 1. **Agent Prompt (system)**

Defines the AI's behavior and valid tool schema:

```js
const SYSTEM_PROMPT = `
You are a helpful AI assistant...
Available Tools:
 - getWeatherInfo(city: string)
 - executeCommand(command: string)
...
Output Format:
{ "step": "string", "tool": "string", "input": "string", "content": "string" }
`;
```

---

### 2. **User Query Simulation**

```js
const userQuery = "What is inside my package.json file";
messages.push({ role: "user", content: userQuery });
```

---

### 3. **Tool Implementations**

```js
function getWeatherInfo(cityName) {
  return `This city ${cityName} has a temperature of 42 Degree C`;
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, function (error, stdout, stderr) {
      if (error) reject(error);
      resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
    });
  });
}
```

---

### 4. **Agent Loop Handler**

This loop:

* Sends the updated context to Gemini
* Parses the structured JSON response
* Takes the appropriate action (run tool or output)

```js
while (true) {
  const response = await openai.chat.completions.create(...);
  const parsed = JSON.parse(response.choices[0].message.content);

  if (parsed.step === "think") continue;
  if (parsed.step === "action") {
    const value = await TOOLS_MAP[parsed.tool](parsed.input);
    messages.push({ role: "assistant", content: JSON.stringify({ step: "observe", content: value }) });
    continue;
  }
  if (parsed.step === "output") break;
}
```

---

## 📐 How It's Like Cursor

| Feature                  | Cursor IDE        | This Project                       |
| ------------------------ | ----------------- | ---------------------------------- |
| Ask AI in-editor         | ✅                 | ✅ (via CLI / prompt simulation)    |
| Tool-use reasoning       | ✅ (internal)      | ✅ Explicit `THINK`/`ACT`/`OBSERVE` |
| Terminal command access  | ❌ (isolated)      | ✅ `exec()`-based real commands     |
| Custom tools integration | ❌ Limited         | ✅ Easily pluggable (`TOOLS_MAP`)   |
| Transparent reasoning    | ❌ Hidden thoughts | ✅ Full trace in structured JSON    |

---

## ⚙️ Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` with Gemini key:

```env
GEMINI_API_KEY=your_api_key_here
```

3. Run the app:

```bash
node index.js
```

---

## 🔧 Extending It (Plugin-Like Behavior)

You can add tools like:

* `searchDocs(query)`
* `createFile(path, content)`
* `formatCode(language, code)`

Update the `TOOLS_MAP` and prompt `Available Tools:` section accordingly.

---

## 🔐 Security Warning

The `executeCommand()` tool runs raw shell commands from AI input. You should:

* Sanitize input if deploying this
* Restrict command types (e.g., read-only)
* Avoid usage in production without sandboxing

---

