
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
  const isInitialMount = useRef(true);

  useEffect(() => {
    fetchConversations();
    const channel = subscribeToNewMessages();
    startAutoChat();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [groupId]);

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
          setConversations(prev => [...prev, payload.new as any]);
        }
      )
      .subscribe();

    return channel;
  };

  const generateMessage = async (agent: Agent) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const lastConversations = conversations.slice(-5);
      const conversationContext = lastConversations
        .map(c => `${agents.find(a => a.id === c.agent_id)?.name || '未知'}: ${c.content}`)
        .join('\n');

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer sk-680da8e9dcb74c2dac7a60f356a16e65`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `你是${agent.name}，在一个${theme}世界观的故事中。根据你的角色特点(${agent.description})生成对话或行动。要求：
              1. 对话要有趣且富有创意
              2. 要继续推进故事发展
              3. 要与其他角色互动
              4. 符合${theme}的世界观设定`
            },
            {
              role: "user",
              content: `请根据当前情况，生成一段${agent.name}的对话或行动。当前对话记录：\n${conversationContext}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.8
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        const { error } = await supabase
          .from('world_conversations')
          .insert([{
            world_group_id: groupId,
            agent_id: agent.id,
            content: data.choices[0].message.content
          }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error generating message:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startAutoChat = () => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      agents.forEach((agent, index) => {
        const baseDelay = 5000; // 基础延迟5秒
        const interval = baseDelay + (index * 2000); // 每个智能体额外增加2秒延迟
        setInterval(() => generateMessage(agent), interval);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{groupName}</h3>
        <span className="text-sm text-muted-foreground">主题：{theme}</span>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {conversations.map((conversation) => {
          const agent = agents.find(a => a.id === conversation.agent_id);
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
      </div>
    </div>
  );
};
