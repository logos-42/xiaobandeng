import { useState } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConversationAreaProps {
  selectedAgents: Agent[];
  conversations: string[];
  onStartConversation: (prompt: string) => void;
}

export const ConversationArea = ({
  selectedAgents,
  conversations,
  onStartConversation,
}: ConversationAreaProps) => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">对话区域</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="输入你的情感提示..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={selectedAgents.length === 0}
          />
          <Button
            onClick={() => {
              onStartConversation(prompt);
              setPrompt("");
            }}
            disabled={!prompt || selectedAgents.length === 0}
          >
            开始对话
          </Button>
        </div>

        <div className="space-y-3 mt-4">
          {conversations.map((conversation, index) => (
            <div key={index} className="conversation-bubble">
              <p>{conversation}</p>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              选择智能体并开始对话，看看会发生什么神奇的事情！
            </p>
          )}
        </div>
      </div>
    </div>
  );
};