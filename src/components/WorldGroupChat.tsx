
import { useEffect } from "react";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useConversations } from "@/hooks/useConversations";
import { useConversationGeneration } from "@/hooks/useConversationGeneration";
import { ConversationMessage } from "./conversation/ConversationMessage";
import { Loader } from "lucide-react";

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
    isGenerating,
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

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      stopGenerationCycle();
    } else {
      startGenerationCycle();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{groupName}</h3>
        <span className="text-sm text-muted-foreground">主题：{theme}</span>
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

      <div className="flex justify-center items-center gap-4 pt-4 border-t">
        {isGenerating && !isPaused && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader className="w-4 h-4 animate-spin" />
            <span>正在生成对话...</span>
          </div>
        )}
        <button
          onClick={handlePauseToggle}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isPaused 
              ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground" 
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
        >
          {isPaused ? "开始生成对话" : "暂停生成"}
        </button>
      </div>
    </div>
  );
};
