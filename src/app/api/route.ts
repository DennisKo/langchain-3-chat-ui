import { ChatOpenAI } from "langchain/chat_models/openai";
import { CallbackManager } from "langchain/callbacks";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import {
  AIChatMessage,
  BaseChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from "langchain/schema";
import { NextResponse } from "next/server";
import { ConversationChain } from "langchain/chains";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { getConfig } from "../../config";

export const runtime = "edge";

/**
 * Maps an array of stored chat messages to an array of ChatMessage objects.
 * @param messages An array of stored chat messages.
 * @returns An array of ChatMessage objects.
 */
function mapStoredMessagesToChatMessages(
  messages: BaseChatMessage[]
): BaseChatMessage[] {
  return messages.map((message) => {
    switch (message.name) {
      case "human":
        return new HumanChatMessage(message.text);
      case "ai":
        return new AIChatMessage(message.text);
      case "system":
        return new SystemChatMessage(message.text);
      default:
        throw new Error("Role must be defined for generic messages");
    }
  });
}

/**
 * Handles incoming HTTP POST requests to the chat API endpoint.
 * @param req The HTTP request object.
 * @returns A NextResponse object with a readable stream of chat messages.
 */
export async function POST(req: Request) {
  const config = getConfig(); // Load configuration from a separate file.
  const authHeader = req.headers.get("Authorization");

  // Check if the request is authorized.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.substring("Bearer ".length);
  if (token !== config.apiKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const messages = body.messages;
    const prompt = body.prompt;

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    let counter = 0;
    let string = "";
    const chat = new ChatOpenAI({
      streaming: true,
      maxRetries: 1,
      callbackManager: CallbackManager.fromHandlers({
        handleLLMNewToken: async (token: string, runId, parentRunId) => {
          await writer.ready;
          string += token;
          counter++;
          await writer.write(encoder.encode(`${token}`));
        },
        handleLLMEnd: async () => {
          await writer.ready;
          await writer.close();
        },
        handleLLMError: async (e) => {
          await writer.ready;
          console.log("handleLLMError Error: ", e);
          await writer.abort(e);
        },
      }),
    });
    const lcChatMessageHistory = new ChatMessageHistory(
      mapStoredMessagesToChatMessages(messages)
    );
    const memory = new BufferMemory({
      chatHistory: lcChatMessageHistory,
      returnMessages: true,
      memoryKey: "history",
    });

    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate("You are a friendly assistant."),
      new MessagesPlaceholder("history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
    ]);

    const chain = new ConversationChain({
      memory: memory,
      llm: chat,
      prompt: chatPrompt,
    });

    chain.call({
      input: prompt,
    });

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Error processing request", { status: 500 });
  }
}
