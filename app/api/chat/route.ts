import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We use 1.5-flash or 2.5-flash based on availability. 2.5-flash worked previously.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are the OpenHealth Assistant, an expert in US medical billing and healthcare costs. 
      Your goal is to help users understand their medical bills and find cost estimates.
      You have access to the OpenHealth database, which contains crowdsourced procedure data.
      
      Guidelines:
      1. Be empathetic and professional.
      2. If asked about procedure costs, ALWAYS call the queryHealthData tool.
      3. Format currency values clearly.`,
    });

    const formattedHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
    
    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
      history: formattedHistory,
      tools: [{
        functionDeclarations: [{
          name: "queryHealthData",
          description: "Search the OpenHealth database for procedure cost data.",
          parameters: {
            type: "OBJECT",
            properties: {
              query: { type: "STRING" }
            },
            required: ["query"]
          }
        }]
      }]
    });

    let result = await chat.sendMessage(lastMessage);
    let call = result.response.functionCalls()?.[0];
    
    if (call && call.name === "queryHealthData") {
      const q = call.args.query as string;
      const data = await convex.query(api.search.searchProcedures, { q });
      
      const dbResults = data.map(r => ({
        procedure: r.procedureDescription,
        hospital: r.hospitalName,
        billedAmount: Number(r.billedAmount),
        allowedAmount: Number(r.allowedAmount),
      }));
      
      result = await chat.sendMessage([{
        functionResponse: {
          name: "queryHealthData",
          response: { results: dbResults }
        }
      }]);
    }

    const finalResponseText = result.response.text();

    const stream = new ReadableStream({
      start(controller) {
        // Vercel AI SDK expects text chunks to be prefixed with 0: and JSON stringified
        const chunk = `0:${JSON.stringify(finalResponseText)}\n`;
        controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1'
      },
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    const errorMessage = "API Error: " + (error.message || 'Unknown error');
    
    const stream = new ReadableStream({
      start(controller) {
        const chunk = `0:${JSON.stringify(errorMessage)}\n`;
        controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      }
    });

    return new Response(stream, {
      status: 200, // Return 200 so the UI displays the streamed error text
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1'
      },
    });
  }
}
