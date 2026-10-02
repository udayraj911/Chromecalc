import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, ThinkingLevel, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Standard Gemini Chat API (using gemini-3.5-flash for fast multi-turn conversations)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array" });
    }

    const systemInstruction = 
      "You are Sparky, a super-smart interactive math calculator companion. " +
      "You are charming, witty, love calculations, and explain mathematics with enthusiasm. " +
      "Provide very brief, clear answers. Use markdown formatting. " +
      "If the user asks you to calculate something, feel free to give the result and explain the concept.";

    // Populate history
    const sdkHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const lastMessage = messages[messages.length - 1];
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let lastError = null;
    let textResult = "";

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting /api/chat with model: ${modelName}`);
        const chat = ai.chats.create({
          model: modelName,
          history: sdkHistory,
          config: {
            systemInstruction,
          }
        });
        const response = await chat.sendMessage({ message: lastMessage.content });
        textResult = response.text || "";
        lastError = null;
        break; // Success!
      } catch (err: any) {
        console.warn(`Chat failed with model ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (lastError) {
      throw lastError;
    }

    res.json({ text: textResult });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// High-Thinking Gemini API (using gemini-3.1-pro-preview with HIGH thinking)
app.post("/api/thinking", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array" });
    }

    const systemInstruction = 
      "You are a Senior Mathematician and AI reasoning expert with deep thinking enabled. " +
      "You solve complex word problems, algebraic equations, calculus, or physics problems " +
      "by thinking step-by-step. Break down your reasoning clearly.";

    // Populate history
    const sdkHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const lastMessage = messages[messages.length - 1];
    const modelsToTry = [
      { name: "gemini-3.1-pro-preview", useThinking: true },
      { name: "gemini-3.5-flash", useThinking: true },
      { name: "gemini-3.1-flash-lite", useThinking: false }
    ];
    let lastError = null;
    let textResult = "";

    for (const modelConfig of modelsToTry) {
      try {
        console.log(`Attempting /api/thinking with model: ${modelConfig.name}`);
        const config: any = { systemInstruction };
        if (modelConfig.useThinking) {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH
          };
        }
        const chat = ai.chats.create({
          model: modelConfig.name,
          history: sdkHistory,
          config
        });
        const response = await chat.sendMessage({ message: lastMessage.content });
        textResult = response.text || "";
        lastError = null;
        break; // Success!
      } catch (err: any) {
        console.warn(`Thinking failed with model ${modelConfig.name}:`, err.message || err);
        lastError = err;
      }
    }

    if (lastError) {
      throw lastError;
    }

    res.json({ text: textResult });
  } catch (error: any) {
    console.error("Thinking API error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Explain Formula / Analyze Math
app.post("/api/explain", async (req, res) => {
  try {
    const { expression, result } = req.body;
    if (!expression) {
      return res.status(400).json({ error: "Expression is required" });
    }

    const prompt = `Provide a fun, interesting, and brief mathematical explanation of why or how the calculation "${expression} = ${result || '?'}" works. Are there any cool real-world applications or historical math facts associated with this? Keep it very engaging, readable, and under 3-4 sentences. Use markdown.`;

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let lastError = null;
    let textResult = "";

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting /api/explain with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are an enthusiastic math popularizer. Keep it punchy, friendly, and fascinating!"
          }
        });
        textResult = response.text || "";
        lastError = null;
        break; // Success!
      } catch (err: any) {
        console.warn(`Explain failed with model ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (lastError) {
      throw lastError;
    }

    res.json({ text: textResult });
  } catch (error: any) {
    console.error("Explain Formula API error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Natural Language Math Parser
app.post("/api/natural-calc", async (req, res) => {
  try {
    const { sentence } = req.body;
    if (!sentence) {
      return res.status(400).json({ error: "Sentence is required" });
    }

    const prompt = `Translate the following math expression expressed in natural language into a clean, JavaScript-evaluatable mathematical expression (using only numbers, operators like +, -, *, /, ^, and standard parentheses) and provide a brief, friendly, 1-sentence explanation of the steps.
    
    Query: "${sentence}"`;

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let lastError = null;
    let textResult = "";

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting /api/natural-calc with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are an expert mathematical translator that converts spoken or written English math statements into standardized numerical formulas and friendly step explanations. Return valid JSON only.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                expression: {
                  type: Type.STRING,
                  description: "The mathematical expression with standard symbols, e.g. '120 * 0.25 + 12' or 'sqrt(144) - 5'",
                },
                explanation: {
                  type: Type.STRING,
                  description: "A brief, charming 1-sentence mathematical explanation",
                }
              },
              required: ["expression", "explanation"]
            }
          }
        });
        textResult = response.text || "";
        lastError = null;
        break; // Success!
      } catch (err: any) {
        console.warn(`Natural calc failed with model ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (lastError) {
      throw lastError;
    }

    const parsed = JSON.parse(textResult);
    res.json(parsed);
  } catch (error: any) {
    console.error("Natural calc API error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Lens / Vision OCR Math Analyzer
app.post("/api/lens", async (req, res) => {
  try {
    const { image, prompt: customPrompt } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Clean base64 string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = image.substring(image.indexOf(":") + 1, image.indexOf(";")) || "image/jpeg";

    const promptText = customPrompt || 
      "Analyze this image containing mathematical equations, homework, bills, receipts, tables, or numbers. " +
      "Identify all key numerical expressions and calculate the exact results. " +
      "Return standard JSON with: " +
      "1) 'extractedMath': concise string summarizing the math problem or line items, " +
      "2) 'expression': a standard evaluatable math formula (e.g. '120 * 0.18 + 45'), " +
      "3) 'result': final calculated numeric answer or summary, " +
      "4) 'stepByStep': clear markdown explanation of the calculation breakdown.";

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let lastError = null;
    let textResult = "";

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting /api/lens with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: promptText }
          ],
          config: {
            systemInstruction: "You are ChromaCalc Lens, a world-class AI vision system that reads math, homework, bills, receipts, and whiteboard diagrams. Extract math numbers accurately and solve step-by-step.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                extractedMath: { type: Type.STRING },
                expression: { type: Type.STRING },
                result: { type: Type.STRING },
                stepByStep: { type: Type.STRING }
              },
              required: ["extractedMath", "expression", "result", "stepByStep"]
            }
          }
        });
        textResult = response.text || "";
        lastError = null;
        break; // Success!
      } catch (err: any) {
        console.warn(`Lens failed with model ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (lastError) {
      throw lastError;
    }

    const parsed = JSON.parse(textResult);
    res.json(parsed);
  } catch (error: any) {
    console.error("Lens Vision API error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Create Server
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Setup Live Speech Session Bridge
wss.on("connection", async (clientWs) => {
  console.log("Client connected to Voice Live WebSocket");
  let liveSession: any = null;

  try {
    liveSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Zephyr" } // Zephyr is pleasant and clear
          }
        },
        systemInstruction: "You are Sparky, an interactive audio calculator assistant. You help people calculate and solve math through voice. You are friendly, charming, and keep spoken answers very short, direct, and under 2 sentences. Give answers directly and cheer them on!",
      },
      callbacks: {
        onmessage: (message) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
          // Handle transcript if available (or transcription objects)
          const transcript = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (transcript) {
            clientWs.send(JSON.stringify({ transcript }));
          }
        },
        onclose: () => {
          console.log("Gemini Live API connection closed");
          clientWs.close();
        },
        onerror: (err) => {
          console.error("Gemini Live API error:", err);
          clientWs.send(JSON.stringify({ error: err.message || "Gemini Live API encountered an error" }));
        }
      }
    });

    clientWs.on("message", (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: "audio/pcm;rate=16000"
            }
          });
        }
      } catch (err) {
        console.error("Error processing client WS payload:", err);
      }
    });

    clientWs.on("close", () => {
      console.log("Client voice WebSocket disconnected");
      if (liveSession) {
        liveSession.close();
      }
    });

  } catch (error: any) {
    console.error("Failed to connect to Gemini Live:", error);
    clientWs.send(JSON.stringify({ error: `Could not reach live speech system: ${error.message}` }));
    clientWs.close();
  }
});

// Upgrade WebSocket connections for "/api/live"
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/api/live") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start listening and serve frontend routes
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
