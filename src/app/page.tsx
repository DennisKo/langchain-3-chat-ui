"use client";
import { Message } from "@/components/Message";
import SendIcon from "@/components/SendIcon";
import Spinner from "@/components/Spinner";
import ScrollToBottom from "react-scroll-to-bottom";
import { useEffect, useReducer, useRef, KeyboardEvent } from "react";
import TextareaAutosize from "react-textarea-autosize";

interface Message {
  name: "human" | "ai" | "system";
  text: string;
}

interface AppState {
  messages: Message[] | [];
  assistantThinking: boolean;
  isWriting: boolean;
  controller: AbortController | null;
}

type AddMessage = {
  type: "addMessage";
  payload: { prompt: string; controller: AbortController };
};
type UpdatePromptAnswer = { type: "updatePromptAnswer"; payload: string };
type Abort = { type: "abort" };
type Done = { type: "done" };
type AppActions = AddMessage | UpdatePromptAnswer | Abort | Done;

function reducer(state: AppState, action: AppActions): AppState {
  switch (action.type) {
    case "addMessage":
      return {
        ...state,
        assistantThinking: true,
        messages: [
          ...state.messages,
          { name: "human", text: action.payload.prompt },
          { name: "ai", text: "" },
        ],
        controller: action.payload.controller,
      };
    case "updatePromptAnswer":
      const conversationListCopy = [...state.messages];
      const lastIndex = conversationListCopy.length - 1;
      conversationListCopy[lastIndex] = {
        ...conversationListCopy[lastIndex],
        text: conversationListCopy[lastIndex].text + action.payload,
      };

      return {
        ...state,
        assistantThinking: false,
        isWriting: true,
        messages: conversationListCopy,
      };
    case "abort":
      state.controller?.abort();
      return {
        ...state,
        isWriting: false,
        assistantThinking: false,
        controller: null,
      };
    case "done":
      return {
        ...state,
        isWriting: false,
        assistantThinking: false,
        controller: null,
      };
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    assistantThinking: false,
    isWriting: false,
    controller: null,
  });

  const promptInput = useRef<HTMLTextAreaElement>(null);

  const handlePrompt = async () => {
    if (promptInput && promptInput.current) {
      const prompt = promptInput.current.value;
      if (prompt !== "") {
        const controller = new AbortController();
        const signal = controller.signal;
        dispatch({ type: "addMessage", payload: { prompt, controller } });
        promptInput.current.value = "";

        const res = await fetch("/api", {
          method: "POST",
          body: JSON.stringify({ messages: state.messages, prompt }),
          signal: signal,
        });
        const data = res.body;
        if (!data) {
          return;
        }

        const reader = data.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          const chunkValue = decoder.decode(value);
          dispatch({ type: "updatePromptAnswer", payload: chunkValue });
        }
        if (done) {
          dispatch({ type: "done" });
        }
      }
    }
  };

  const handlePromptKey = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePrompt();
    }
  };

  const handleAbort = () => {
    dispatch({ type: "abort" });
  };

  // focus input on page load
  useEffect(() => {
    if (promptInput && promptInput.current) {
      promptInput.current.focus();
    }
  }, []);

  return (
    <div className="flex h-full relative flex-1">
      <main className="relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch max-w-3xl ml-auto mr-auto pb-12 font-default">
        <div className="flex-1 overflow-hidden ">
          <ScrollToBottom
            className="relative h-full pb-14 pt-6"
            scrollViewClassName="h-full overflow-y-auto"
          >
            <div className="w-full transition-width flex flex-col items-stretch flex-1">
              <div className="flex-1">
                <div className="flex flex-col prose prose-lg prose-invert">
                  {state.messages.map((message, i) => (
                    <Message
                      key={i}
                      name={message.name}
                      text={message.text}
                      thinking={state.assistantThinking}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollToBottom>
        </div>
        <div className="absolute bottom-6  w-full px-1">
          {(state.assistantThinking || state.isWriting) && (
            <div className="flex mx-auto justify-center mb-2">
              <button
                type="button"
                className="rounded bg-indigo-50 py-1 px-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100"
                onClick={handleAbort}
              >
                Stop generating
              </button>
            </div>
          )}
          <div className="relative flex flex-col w-full p-3  bg-gray-800 rounded-md shadow ring-1 ring-gray-200 dark:ring-gray-600 focus-within:ring-2 focus-within:ring-inset dark:focus-within:ring-indigo-600 focus-within:ring-indigo-600">
            <label htmlFor="prompt" className="sr-only">
              Prompt
            </label>
            <TextareaAutosize
              ref={promptInput}
              name="prompt"
              id="prompt"
              rows={1}
              maxRows={6}
              onKeyDown={handlePromptKey}
              className="m-0 w-full resize-none border-0 bg-transparent  pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent text-gray-800 dark:text-gray-50 text-base"
              placeholder="How can I build a chatbot in JavaScript?"
              defaultValue="How can I build a chatbot in JavaScript?"
            />
            <div className="absolute right-3 top-[calc(50%_-_10px)]">
              {state.assistantThinking || state.isWriting ? (
                <Spinner cx="animate-spin w-5 h-5 text-gray-400" />
              ) : (
                <SendIcon
                  cx="w-5 h-5 text-gray-400 hover:text-gray-500 hover:cursor-pointer"
                  onClick={handlePrompt}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
