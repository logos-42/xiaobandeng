
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversation {
  id: string;
  content: string;
  agent_id: string;
  created_at: string;
}

export const useConversations = (groupId: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

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
          setConversations(prev => [...prev, payload.new as Conversation]);
        }
      )
      .subscribe();

    return channel;
  };

  return {
    conversations,
    fetchConversations,
    subscribeToNewMessages
  };
};
