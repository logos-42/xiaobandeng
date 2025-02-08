
import { useState } from "react";
import { Agent } from "@/types/agent";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ConversationInput } from "./conversation/ConversationInput";
import { ConversationList } from "./conversation/ConversationList";

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
  const [isLoading, setIsLoading] = useState(false);

  const generateConversation = async (userPrompt: string) => {
    if (selectedAgents.length === 0) {
      toast.error("请先选择至少一个智能体");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-conversation', {
        body: {
          agents: selectedAgents,
          prompt: userPrompt
        }
      });

      if (error) throw error;

      if (data.choices && data.choices[0]) {
        onStartConversation(data.choices[0].message.content);
        
        const worldThemes = ["玄幻", "科幻", "言情", "武侠", "都市"];
        const randomTheme = worldThemes[Math.floor(Math.random() * worldThemes.length)];
        
        const { data: worldGroup, error: worldGroupError } = await supabase
          .from('world_groups')
          .insert([{
            name: `${selectedAgents[0].name}的${randomTheme}世界`,
            theme: randomTheme,
            description: `由${selectedAgents.map(a => a.name).join('、')}发起的${randomTheme}冒险`
          }])
          .select()
          .single();

        if (worldGroupError) throw worldGroupError;

        const worldGroupAgents = selectedAgents.map(agent => ({
          world_group_id: worldGroup.id,
          agent_id: agent.id
        }));

        const { error: agentsError } = await supabase
          .from('world_group_agents')
          .insert(worldGroupAgents);

        if (agentsError) throw agentsError;

        const { error: conversationError } = await supabase
          .from('world_conversations')
          .insert([{
            world_group_id: worldGroup.id,
            content: data.choices[0].message.content,
            agent_id: selectedAgents[0].id
          }]);

        if (conversationError) throw conversationError;

        toast.success(`已创建新的${randomTheme}世界群组！`);
      }
    } catch (error) {
      console.error("生成对话失败:", error);
      toast.error("生成对话失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">对话区域</h2>
      <div className="space-y-4">
        <ConversationInput
          onSubmit={generateConversation}
          isDisabled={selectedAgents.length === 0}
          isLoading={isLoading}
        />
        <ConversationList conversations={conversations} />
      </div>
    </div>
  );
};
