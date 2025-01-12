import { useState, useEffect } from "react";
import { AgentsList } from "@/components/AgentsList";
import { PublicAgents } from "@/components/PublicAgents";
import { ConversationArea } from "@/components/ConversationArea";
import { CreateAgent } from "@/components/CreateAgent";
import { Agent } from "@/types/agent";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [privateAgents, setPrivateAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<string[]>([]);
  const [sharedAgents, setSharedAgents] = useState<Agent[]>([]);

  useEffect(() => {
    loadUserAgents();
  }, []);

  const loadUserAgents = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', session.user.id)
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("请先登录");
      return;
    }

    const { data, error } = await supabase
      .from('agents')
      .insert([
        {
          name: agent.name,
          description: agent.description,
          user_id: session.user.id,
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("退出登录失败");
      return;
    }
    navigate("/auth");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-primary">情绪炼金术</h1>
        <Button variant="outline" onClick={handleLogout}>
          退出登录
        </Button>
      </div>
      
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