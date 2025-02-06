import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchConversations();
    subscribeToNewMessages();
    startAutoChat();
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

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const generateMessage = async (agent: Agent) => {
    try {
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
              content: `你是${agent.name}，在一个${theme}世界观的故事中。请基于当前的对话记录，生成一段富有创意的对话或行动。记住要符合你的角色特点和世界观设定。`
            },
            {
              role: "user",
              content: `请根据当前情况，生成一段${agent.name}的对话或行动。当前对话记录：${conversations.map(c => 
                `${agents.find(a => a.id === c.agent_id)?.name || '未知'}: ${c.content}`).join('\n')}`
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
    }
  };

  const startAutoChat = () => {
    agents.forEach(agent => {
      const interval = Math.random() * 20000 + 10000; // 10-30秒随机间隔
      setInterval(() => generateMessage(agent), interval);
    });
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