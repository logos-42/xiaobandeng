import { useState } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateConversation = async (userPrompt: string) => {
    if (selectedAgents.length === 0) {
      toast.error("请先选择至少一个智能体");
      return;
    }

    if (!userPrompt.trim()) {
      toast.error("请输入对话提示");
      return;
    }

    setIsLoading(true);
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
              content: `你是一个创新的对话生成器。请基于以下智能体的特点，生成一段富有新意的对话：${selectedAgents.map(agent => 
                `${agent.name}(${agent.description})`).join(", ")}。对话应该围绕主题："${userPrompt}"展开，保持新颖性和创意性。`
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.8
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        // 创建对话记录
        onStartConversation(data.choices[0].message.content);
        
        // 自动创建世界群组
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

        // 添加智能体到世界群组
        const worldGroupAgents = selectedAgents.map(agent => ({
          world_group_id: worldGroup.id,
          agent_id: agent.id
        }));

        const { error: agentsError } = await supabase
          .from('world_group_agents')
          .insert(worldGroupAgents);

        if (agentsError) throw agentsError;

        // 添加初始对话到世界群组
        const { error: conversationError } = await supabase
          .from('world_conversations')
          .insert([{
            world_group_id: worldGroup.id,
            content: data.choices[0].message.content,
            agent_id: selectedAgents[0].id
          }]);

        if (conversationError) throw conversationError;

        toast.success(`已创建新的${randomTheme}世界群组！`);
        setPrompt("");
      }
    } catch (error) {
      console.error("生成对话失败:", error);
      toast.error("生成对话失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        generateConversation(prompt);
      }
    }
  };

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">对话区域</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="输入你的情感提示..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={selectedAgents.length === 0 || isLoading}
          />
          <Button
            onClick={() => generateConversation(prompt)}
            disabled={!prompt.trim() || selectedAgents.length === 0 || isLoading}
          >
            {isLoading ? "生成中..." : "开始对话"}
          </Button>
        </div>

        <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
          {conversations.map((conversation, index) => (
            <div key={index} className="p-4 rounded-lg bg-secondary/20">
              <p className="whitespace-pre-wrap">{conversation}</p>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              选择智能体并开始对话，看看会发生什么神奇的事情！
            </p>
          )}
        </div>
      </div>
    </div>
  );
};