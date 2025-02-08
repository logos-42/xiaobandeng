
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
  const currentAgentIndex = useRef(0);

  // Remove duplicate agents by ID
  const uniqueAgents = agents.filter((agent, index, self) =>
    index === self.findIndex((a) => a.id === agent.id)
  );

  useEffect(() => {
    console.log("WorldGroupChat mounted with groupId:", groupId);
    fetchConversations();
    const channel = subscribeToNewMessages();
    
    if (!isPaused) {
      initializeAutoChat();
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

  const generateMessage = async (agent: Agent) => {
    if (isGenerating || isPaused) {
      console.log("Skipping message generation - generating:", isGenerating, "paused:", isPaused);
      return;
    }
    
    setIsGenerating(true);
    try {
      console.log("Generating message for agent:", agent.name);
      const lastConversations = conversations.slice(-5);
      const conversationContext = lastConversations
        .map(c => `${uniqueAgents.find(a => a.id === c.agent_id)?.name || '未知'}: ${c.content}`)
        .join('\n');

      const { data: generatedData, error: functionError } = await supabase.functions.invoke('generate-message', {
        body: {
          agent,
          context: conversationContext,
          theme
        }
      });

      if (functionError) throw functionError;
      
      if (generatedData.choices && generatedData.choices[0]) {
        const { error } = await supabase
          .from('world_conversations')
          .insert([{
            world_group_id: groupId,
            agent_id: agent.id,
            content: generatedData.choices[0].message.content
          }]);

        if (error) throw error;
        console.log("Successfully inserted new message");
      }
    } catch (error) {
      console.error('Error generating message:', error);
      toast.error("生成对话失败，请检查API密钥是否正确设置");
    } finally {
      setIsGenerating(false);
    }
  };

  const initializeAutoChat = () => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initialize with first message if no conversations exist
    if (conversations.length === 0 && uniqueAgents.length > 0) {
      generateMessage(uniqueAgents[0]);
    }

    // Set up rotating message generation
    intervalRef.current = setInterval(() => {
      if (!isPaused && uniqueAgents.length > 0) {
        const nextAgent = uniqueAgents[currentAgentIndex.current];
        generateMessage(nextAgent);
        currentAgentIndex.current = (currentAgentIndex.current + 1) % uniqueAgents.length;
      }
    }, 8000); // Generate a message every 8 seconds
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{groupName}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">主题：{theme}</span>
          <button
            onClick={() => setIsPaused(!isPaused)}
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

