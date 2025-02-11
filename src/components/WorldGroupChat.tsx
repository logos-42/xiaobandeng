
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
  const [groupMembers, setGroupMembers] = useState<Agent[]>([]);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const maxRetries = 5; // 增加最大重试次数
  const [retryCount, setRetryCount] = useState(0);
  const generationIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const minRequestInterval = 15000; // 最小请求间隔设置为 15 秒

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

  const cleanupTimers = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
    }
  };

  const startGenerationCycle = () => {
    generateNewConversation();
    generationIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (!isGenerating && !isPaused && (now - lastRequestTime) >= minRequestInterval) {
        generateNewConversation();
      }
    }, minRequestInterval);
  };

  const stopGenerationCycle = () => {
    cleanupTimers();
  };

  const fetchGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('world_group_agents')
        .select('agent_id')
        .eq('world_group_id', groupId);

      if (error) throw error;

      const memberIds = data.map(item => item.agent_id);
      const groupMemberAgents = agents.filter(agent => memberIds.includes(agent.id));
      
      const uniqueMembers = groupMemberAgents.filter((member, index, self) =>
        index === self.findIndex((m) => m.id === member.id)
      );

      console.log("Group members:", uniqueMembers);
      setGroupMembers(uniqueMembers);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast.error("获取群组成员失败");
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('world_conversations')
        .select('*')
        .eq('world_group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
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

  const calculateRetryDelay = (retryCount: number) => {
    // 指数退避策略，基础延迟为 5 秒
    const baseDelay = 5000;
    const maxDelay = 30000; // 最大延迟 30 秒
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    return Math.min(exponentialDelay, maxDelay);
  };

  const scheduleNextGeneration = (delay: number = calculateRetryDelay(retryCount)) => {
    if (!isPaused) {
      console.log(`Scheduling next generation in ${delay}ms`);
      cleanupTimers();
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(0);
        generateNewConversation();
      }, delay);
    }
  };

  const generateNewConversation = async () => {
    if (isGenerating || isPaused || groupMembers.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime < minRequestInterval) {
      console.log("Skipping request due to rate limiting");
      return;
    }
    
    setIsGenerating(true);
    setLastRequestTime(now);

    try {
      console.log("Generating new conversation with members:", groupMembers);
      const { data: generatedData, error: functionError } = await supabase.functions.invoke('generate-conversation', {
        body: {
          agents: groupMembers,
          prompt: `在${theme}世界观下继续故事情节`
        }
      });

      if (functionError) throw functionError;
      
      if (generatedData.choices && generatedData.choices[0]) {
        const content = generatedData.choices[0].message.content;
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          const agentMatch = groupMembers.find(agent => 
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

            if (error) {
              console.error('Error inserting conversation:', error);
              continue;
            }
          }
        }
        setRetryCount(0);
        scheduleNextGeneration(minRequestInterval);
      }
    } catch (error) {
      console.error('Error generating conversation:', error);
      
      if (retryCount < maxRetries) {
        const nextRetryDelay = calculateRetryDelay(retryCount);
        console.log(`Retry attempt ${retryCount + 1} scheduled in ${nextRetryDelay}ms`);
        setRetryCount(prev => prev + 1);
        scheduleNextGeneration(nextRetryDelay);
      } else {
        toast.error("生成对话失败，已达到最大重试次数");
        setIsPaused(true);
      }
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
              if (isPaused) {
                setRetryCount(0);
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
        {conversations.map((conversation) => {
          const agent = groupMembers.find(a => a.id === conversation.agent_id);
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
