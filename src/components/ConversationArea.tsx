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
      <h2 className="text-xl font-semibold mb-4">Conversations</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter your emotional prompt..."
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
            Start
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
              Select agents and start a conversation to see the magic happen!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};