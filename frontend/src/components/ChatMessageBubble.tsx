import React from "react";

interface Props {
  role: "user" | "assistant";
  children: React.ReactNode;
}

export default function ChatMessageBubble({ role, children }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xl px-4 py-3 rounded-lg shadow-md ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white text-gray-800 border rounded-bl-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
