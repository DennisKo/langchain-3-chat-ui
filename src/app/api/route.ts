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

export const runtime = "edge";

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

export async function POST(req: Request) {
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
}
