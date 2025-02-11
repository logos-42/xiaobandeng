
import { Agent } from "@/types/agent";

interface ConversationMessageProps {
  conversation: {
    id: string;
    content: string;
    agent_id: string;
    created_at: string;
  };
  agent?: Agent;
}

export const ConversationMessage = ({ conversation, agent }: ConversationMessageProps) => {
  return (
    <div className="p-3 rounded-lg bg-secondary/20">
      <div className="flex justify-between items-start">
        <span className="font-medium">{agent?.name || '未知'}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(conversation.created_at).toLocaleString()}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-wrap">{conversation.content}</p>
    </div>
  );
};
