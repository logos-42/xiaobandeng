import { useState } from "react";
import { AgentsList } from "@/components/AgentsList";
import { PublicAgents } from "@/components/PublicAgents";
import { ConversationArea } from "@/components/ConversationArea";
import { CreateAgent } from "@/components/CreateAgent";
import { Agent } from "@/types/agent";
import { toast } from "sonner";

// DeepSeek API key - 在实际应用中应该从环境变量或安全的配置中获取
const DEEPSEEK_API_KEY = "sk-680da8e9dcb74c2dac7a60f356a16e65";

const Index = () => {
  const [privateAgents, setPrivateAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<string[]>([]);

  const handleCreateAgent = (agent: Agent) => {
    if (privateAgents.some(existingAgent => existingAgent.name === agent.name)) {
      toast.error("已存在同名智能体");
      return;
    }
    setPrivateAgents([...privateAgents, agent]);
    console.log("创建新智能体:", agent);
  };

  const handleAgentSelect = (agent: Agent) => {
    if (selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
    console.log("已选择的智能体更新为:", selectedAgents);
  };

  const handleStartConversation = (prompt: string) => {
    // 在实际应用中，这里会调用 DeepSeek API
    const newConversation = `${selectedAgents.map(a => a.name).join(" 和 ")}讨论了: ${prompt}`;
    setConversations([newConversation, ...conversations]);
    console.log("开始新对话:", newConversation);
  };

  const handleShareToPublic = (agent: Agent) => {
    // 在实际应用中，这里会将智能体添加到公共数据库
    toast.success(`${agent.name} 已成功分享到公共区域`);
    console.log("分享智能体到公共区域:", agent);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">情绪炼金术</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <CreateAgent 
            onCreateAgent={handleCreateAgent}
            existingAgents={privateAgents}
          />
          <AgentsList 
            agents={privateAgents}
            selectedAgents={selectedAgents}
            onAgentSelect={handleAgentSelect}
            onShareToPublic={handleShareToPublic}
          />
        </div>
        
        <div className="space-y-8">
          <PublicAgents onAddToPrivate={handleCreateAgent} />
          <ConversationArea 
            selectedAgents={selectedAgents}
            conversations={conversations}
            onStartConversation={handleStartConversation}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;