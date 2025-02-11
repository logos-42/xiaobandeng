
import { useEffect } from "react";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useConversations } from "@/hooks/useConversations";
import { useConversationGeneration } from "@/hooks/useConversationGeneration";
import { ConversationMessage } from "./conversation/ConversationMessage";

interface WorldGroupChatProps {
  groupId: string;
  groupName: string;
  theme: string;
  agents: Agent[];
}

export const WorldGroupChat = ({ groupId, groupName, theme, agents }: WorldGroupChatProps) => {
  const { groupMembers, fetchGroupMembers } = useGroupMembers(groupId, agents);
  const { conversations, fetchConversations, subscribeToNewMessages } = useConversations(groupId);
  const {
    isPaused,
    setIsPaused,
    startGenerationCycle,
    stopGenerationCycle,
    cleanupTimers
  } = useConversationGeneration(groupId, groupMembers);

  useEffect(() => {
    console.log("WorldGroupChat mounted with groupId:", groupId);
    fetchGroupMembers();
    fetchConversations();
    const channel = subscribeToNewMessages();
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      cleanupTimers();
    };
  }, [groupId]);

  useEffect(() => {
    if (!isPaused && groupMembers.length > 0) {
      console.log("Starting conversation generation cycle");
      startGenerationCycle();
    } else {
      stopGenerationCycle();
    }
  }, [isPaused, groupMembers]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{groupName}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">主题：{theme}</span>
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              if (isPaused) {
                startGenerationCycle();
              } else {
                stopGenerationCycle();
              }
            }}
            className={`px-3 py-1 rounded text-sm ${
              isPaused 
                ? "bg-green-500 hover:bg-green-600 text-white" 
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {isPaused ? "继续对话" : "暂停对话"}
          </button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {conversations.map((conversation) => (
          <ConversationMessage
            key={conversation.id}
            conversation={conversation}
            agent={groupMembers.find(a => a.id === conversation.agent_id)}
          />
        ))}
        {conversations.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            正在准备对话...
          </div>
        )}
      </div>
    </div>
  );
};
