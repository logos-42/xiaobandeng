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

  // 获取所有智能体
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      // 获取私有智能体
      const { data: privateData, error: privateError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_public', false);

      if (privateError) throw privateError;
      
      const formattedPrivateAgents = privateData.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description || "",
        isPublic: agent.is_public || false,
        createdAt: new Date(agent.created_at)
      }));
      
      setPrivateAgents(formattedPrivateAgents);

      // 获取公共智能体
      const { data: publicData, error: publicError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_public', true);

      if (publicError) throw publicError;
      
      const formattedPublicAgents = publicData.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description || "",
        isPublic: agent.is_public || false,
        createdAt: new Date(agent.created_at)
      }));
      
      setSharedAgents(formattedPublicAgents);
      
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error("获取智能体失败");
    }
  };

  const handleCreateAgent = async (agent: Agent) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert([{
          name: agent.name,
          description: agent.description,
          is_public: agent.isPublic
        }])
        .select()
        .single();

      if (error) throw error;

      const newAgent = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        isPublic: data.is_public || false,
        createdAt: new Date(data.created_at)
      };

      setPrivateAgents([...privateAgents, newAgent]);
      toast.success("成功创建新智能体");
      console.log("创建新智能体:", newAgent);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error("创建智能体失败");
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    if (selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
    console.log("已选择的智能体更新为:", selectedAgents);
  };

  const handleStartConversation = async (content: string) => {
    try {
      // 创建对话
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert([{ content }])
        .select()
        .single();

      if (conversationError) throw conversationError;

      // 创建智能体与对话的关联
      const conversationAgents = selectedAgents.map(agent => ({
        conversation_id: conversationData.id,
        agent_id: agent.id
      }));

      const { error: linkError } = await supabase
        .from('conversation_agents')
        .insert(conversationAgents);

      if (linkError) throw linkError;

      setConversations([content, ...conversations]);
      console.log("新对话已添加:", content);
      toast.success("对话已保存");
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error("保存对话失败");
    }
  };

  const handleShareToPublic = async (agent: Agent) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update({ is_public: true })
        .eq('id', agent.id)
        .select()
        .single();

      if (error) throw error;

      const updatedAgent = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        isPublic: true,
        createdAt: new Date(data.created_at)
      };

      setSharedAgents([...sharedAgents, updatedAgent]);
      setPrivateAgents(privateAgents.filter(a => a.id !== agent.id));
      toast.success(`${agent.name} 已成功分享到公共区域`);
      console.log("分享智能体到公共区域:", updatedAgent);
    } catch (error) {
      console.error('Error sharing agent:', error);
      toast.error("分享智能体失败");
    }
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