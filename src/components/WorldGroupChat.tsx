
import { useState, useEffect, useRef } from "react";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorldGroupChatProps {
  groupId: string;
  groupName: string;
  theme: string;
  agents: Agent[];
}

export const WorldGroupChat = ({ groupId, groupName, theme, agents }: WorldGroupChatProps) => {
  const [conversations, setConversations] = useState<Array<{
    id: string;
    content: string;
    agent_id: string;
    created_at: string;
  }>>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Remove duplicate agents by ID
  const uniqueAgents = agents.filter((agent, index, self) =>
    index === self.findIndex((a) => a.id === agent.id)
  );

  useEffect(() => {
    console.log("WorldGroupChat mounted with groupId:", groupId);
    fetchConversations();
    const channel = subscribeToNewMessages();
    
    if (!isPaused) {
      generateNewConversation();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [groupId, isPaused]);

  const fetchConversations = async () => {
    try {
      console.log("Fetching conversations for group:", groupId);
      const { data, error } = await supabase
        .from('world_conversations')
        .select('*')
        .eq('world_group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log("Fetched conversations:", data);
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error("获取对话记录失败");
    }
  };

  const subscribeToNewMessages = () => {
    console.log("Setting up realtime subscription for group:", groupId);
    const channel = supabase
      .channel('world_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'world_conversations',
          filter: `world_group_id=eq.${groupId}`
        },
        (payload) => {
          console.log("New message received:", payload);
          setConversations(prev => [...prev, payload.new as any]);
        }
      )
      .subscribe();

    return channel;
  };

  const generateNewConversation = async () => {
    if (isGenerating || isPaused) {
      return;
    }
    
    setIsGenerating(true);
    try {
      console.log("Generating new conversation...");
      const { data: generatedData, error: functionError } = await supabase.functions.invoke('generate-conversation', {
        body: {
          agents: uniqueAgents,
          prompt: `在${theme}世界观下继续故事情节`
        }
      });

      if (functionError) throw functionError;
      
      if (generatedData.choices && generatedData.choices[0]) {
        const content = generatedData.choices[0].message.content;
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          const agentMatch = uniqueAgents.find(agent => 
            line.toLowerCase().startsWith(agent.name.toLowerCase())
          );
          
          if (agentMatch) {
            const { error } = await supabase
              .from('world_conversations')
              .insert([{
                world_group_id: groupId,
                agent_id: agentMatch.id,
                content: line.substring(agentMatch.name.length + 1).trim()
              }]);

            if (error) throw error;
          }
        }
      }
      
      // Schedule next conversation generation after a delay
      setTimeout(() => {
        if (!isPaused) {
          generateNewConversation();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error generating conversation:', error);
      toast.error("生成对话失败");
      // Retry after a longer delay if there's an error
      setTimeout(() => {
        if (!isPaused) {
          generateNewConversation();
        }
      }, 10000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{groupName}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">主题：{theme}</span>
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              if (!isPaused) {
                generateNewConversation();
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
        {conversations.map((conversation) => {
          const agent = uniqueAgents.find(a => a.id === conversation.agent_id);
          return (
            <div key={conversation.id} className="p-3 rounded-lg bg-secondary/20">
              <div className="flex justify-between items-start">
                <span className="font-medium">{agent?.name || '未知'}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(conversation.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{conversation.content}</p>
            </div>
          )}
        )}
        {conversations.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            正在准备对话...
          </div>
        )}
      </div>
    </div>
  );
};
