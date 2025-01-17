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
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      console.log("Fetching agents from database...");
      
      const { data: privateData, error: privateError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_public', false);

      if (privateError) {
        console.error('Error fetching private agents:', privateError);
        throw privateError;
      }
      
      const formattedPrivateAgents = privateData.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description || "",
        isPublic: agent.is_public || false,
        createdAt: new Date(agent.created_at)
      }));
      
      console.log("Fetched private agents:", formattedPrivateAgents);
      setPrivateAgents(formattedPrivateAgents);

      const { data: publicData, error: publicError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_public', true);

      if (publicError) {
        console.error('Error fetching public agents:', publicError);
        throw publicError;
      }
      
      const formattedPublicAgents = publicData.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description || "",
        isPublic: agent.is_public || false,
        createdAt: new Date(agent.created_at)
      }));
      
      console.log("Fetched public agents:", formattedPublicAgents);
      setSharedAgents(formattedPublicAgents);
      
    } catch (error) {
      console.error('Error in fetchAgents:', error);
      toast.error("获取智能体失败");
    }
  };

  const handleCreateAgent = async (agent: Agent) => {
    try {
      console.log("Creating new agent:", agent);
      const { data, error } = await supabase
        .from('agents')
        .insert([{
          name: agent.name,
          description: agent.description,
          is_public: agent.isPublic
        }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating agent:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No data returned after creating agent');
        throw new Error('创建智能体失败');
      }

      const newAgent = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        isPublic: data.is_public || false,
        createdAt: new Date(data.created_at)
      };

      setPrivateAgents([...privateAgents, newAgent]);
      toast.success("成功创建新智能体");
      console.log("Created new agent:", newAgent);
    } catch (error) {
      console.error('Error in handleCreateAgent:', error);
      toast.error("创建智能体失败");
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgents(prev => {
      const isSelected = prev.find(a => a.id === agent.id);
      if (isSelected) {
        return prev.filter(a => a.id !== agent.id);
      } else {
        return [...prev, agent];
      }
    });
    console.log("Selected agents updated");
  };

  const handleStartConversation = async (content: string) => {
    try {
      console.log("Starting new conversation with content:", content);
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert([{ content }])
        .select()
        .maybeSingle();

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        throw conversationError;
      }

      if (!conversationData) {
        console.error('No data returned after creating conversation');
        throw new Error('创建对话失败');
      }

      const conversationAgents = selectedAgents.map(agent => ({
        conversation_id: conversationData.id,
        agent_id: agent.id
      }));

      const { error: linkError } = await supabase
        .from('conversation_agents')
        .insert(conversationAgents);

      if (linkError) {
        console.error('Error linking agents to conversation:', linkError);
        throw linkError;
      }

      setConversations([content, ...conversations]);
      console.log("New conversation added:", content);
      toast.success("对话已保存");
    } catch (error) {
      console.error('Error in handleStartConversation:', error);
      toast.error("保存对话失败");
    }
  };

  const handleShareToPublic = async (agent: Agent) => {
    try {
      console.log("Sharing agent to public:", agent);
      
      const { data: existingAgent, error: checkError } = await supabase
        .from('agents')
        .select()
        .eq('id', agent.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking agent:', checkError);
        throw checkError;
      }
      
      if (!existingAgent) {
        console.error('Agent not found');
        toast.error("找不到要分享的智能体");
        return;
      }

      const { data, error } = await supabase
        .from('agents')
        .update({ is_public: true })
        .eq('id', agent.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error sharing agent:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned after updating agent');
        throw new Error('分享智能体失败');
      }

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
      console.log("Agent shared to public:", updatedAgent);
    } catch (error) {
      console.error('Error in handleShareToPublic:', error);
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