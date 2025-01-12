import { useState, useEffect } from "react";
import { AgentsList } from "@/components/AgentsList";
import { PublicAgents } from "@/components/PublicAgents";
import { ConversationArea } from "@/components/ConversationArea";
import { CreateAgent } from "@/components/CreateAgent";
import { Agent } from "@/types/agent";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [privateAgents, setPrivateAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<string[]>([]);
  const [sharedAgents, setSharedAgents] = useState<Agent[]>([]);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("加载智能体失败:", error);
      toast.error("加载智能体失败");
      return;
    }

    // Transform the data to match our Agent interface
    const transformedAgents: Agent[] = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description || "",
      isPublic: agent.is_public || false,
      createdAt: new Date(agent.created_at)
    }));

    setPrivateAgents(transformedAgents);
  };

  const handleCreateAgent = async (agent: Agent) => {
    const { data, error } = await supabase
      .from('agents')
      .insert([
        {
          name: agent.name,
          description: agent.description,
          is_public: agent.isPublic
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("创建智能体失败:", error);
      toast.error("创建智能体失败");
      return;
    }

    // Transform the returned data to match our Agent interface
    const newAgent: Agent = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      isPublic: data.is_public || false,
      createdAt: new Date(data.created_at)
    };

    setPrivateAgents([newAgent, ...privateAgents]);
    toast.success("成功创建新智能体");
  };

  const handleAgentSelect = (agent: Agent) => {
    if (selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  const handleStartConversation = (response: string) => {
    setConversations([response, ...conversations]);
  };

  const handleShareToPublic = async (agent: Agent) => {
    const { error } = await supabase
      .from('agents')
      .update({ is_public: true })
      .eq('id', agent.id);

    if (error) {
      console.error("分享智能体失败:", error);
      toast.error("分享智能体失败");
      return;
    }

    const updatedAgent = { ...agent, isPublic: true };
    setSharedAgents([...sharedAgents, updatedAgent]);
    toast.success(`${agent.name} 已成功分享到公共区域`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-primary mb-8">情绪炼金术</h1>
      
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
          <PublicAgents 
            onAddToPrivate={handleCreateAgent}
            sharedAgents={sharedAgents}
          />
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