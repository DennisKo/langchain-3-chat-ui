"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageProps {
  name: "human" | "ai" | "system";
  text: string;
  thinking: boolean;
}

function HumanMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start">
      <div className="text-gray-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-10 w-10 mr-2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <div className="bg-gray-800 py-2 px-4 w-full rounded-md min-h-[60px]">
        {text}
      </div>
    </div>
  );
}

function AIMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start">
      <div className=" text-gray-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-10 w-10 mr-2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      </div>
      <div className="bg-gray-800 px-4 w-full rounded-md min-h-[60px]">
        <ReactMarkdown linkTarget="_blank" remarkPlugins={[remarkGfm]}>
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export function Message({ name, text, thinking }: MessageProps) {
  return (
    <div className="w-full min-h-[40px] text-gray-50 rounded-md text-sm font-mono mb-4">
      {name === "ai" ? <AIMessage text={text} /> : <HumanMessage text={text} />}
    </div>
  );
}
