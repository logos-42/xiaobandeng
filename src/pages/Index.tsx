
import { useState, useEffect } from "react";
import { AgentsList } from "@/components/AgentsList";
import { PublicAgents } from "@/components/PublicAgents";
import { ConversationArea } from "@/components/ConversationArea";
import { CreateAgent } from "@/components/CreateAgent";
import { WorldGroups } from "@/components/WorldGroups";
import { Agent } from "@/types/agent";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Users, MessageCircle, Globe, Sparkles } from "lucide-react";

const Index = () => {
  const [privateAgents, setPrivateAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<string[]>([]);
  const [sharedAgents, setSharedAgents] = useState<Agent[]>([]);
  const [activeTab, setActiveTab] = useState<string>("agents");

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
        toast.error("获取私有智能体失败");
        throw privateError;
      }
      
      const formattedPrivateAgents = (privateData || []).map(agent => ({
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
        toast.error("获取公共智能体失败");
        throw publicError;
      }
      
      const formattedPublicAgents = (publicData || []).map(agent => ({
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
        .single();

      if (error) {
        console.error('Error creating agent:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned after creating agent');
      }

      const newAgent: Agent = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        isPublic: data.is_public || false,
        createdAt: new Date(data.created_at)
      };

      setPrivateAgents(prev => [...prev, newAgent]);
      toast.success("成功创建新智能体");
      console.log("Created new agent:", newAgent);
      
    } catch (error) {
      console.error('Error in handleCreateAgent:', error);
      toast.error("创建智能体失败，请重试");
      throw error;
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    try {
      console.log("Deleting agent:", agent);
      
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agent.id);

      if (error) {
        console.error('Error deleting agent:', error);
        throw error;
      }

      setPrivateAgents(privateAgents.filter(a => a.id !== agent.id));
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
      toast.success("智能体已删除");
    } catch (error) {
      console.error('Error in handleDeleteAgent:', error);
      toast.error("删除智能体失败");
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
  };

  const handleShareToPublic = async (agent: Agent) => {
    try {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ is_public: true })
        .eq('id', agent.id);

      if (updateError) throw updateError;

      setPrivateAgents(prev => prev.filter(a => a.id !== agent.id));
      const updatedAgent = { ...agent, isPublic: true };
      setSharedAgents(prev => [...prev, updatedAgent]);
      
      toast.success(`${agent.name} 已成功分享到公共区域`);
      await fetchAgents();
    } catch (error) {
      console.error('Error in handleShareToPublic:', error);
      toast.error("分享智能体失败");
    }
  };

  const handleStartConversation = async (content: string) => {
    try {
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert([{ content }])
        .select()
        .single();

      if (conversationError) throw conversationError;

      if (!conversationData) {
        throw new Error('创建对话失败');
      }

      const conversationAgents = selectedAgents.map(agent => ({
        conversation_id: conversationData.id,
        agent_id: agent.id
      }));

      const { error: linkError } = await supabase
        .from('conversation_agents')
        .insert(conversationAgents);

      if (linkError) throw linkError;

      setConversations([content, ...conversations]);
      toast.success("对话已保存");
    } catch (error) {
      console.error('Error in handleStartConversation:', error);
      toast.error("保存对话失败");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-gradient text-4xl font-bold text-center mb-8">小板凳</h1>
      
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="glass-card p-1 grid grid-cols-4 gap-1 w-full max-w-2xl">
          <button
            onClick={() => setActiveTab("agents")}
            className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all ${
              activeTab === "agents" 
                ? "bg-primary text-white shadow-md" 
                : "hover:bg-white/80"
            }`}
          >
            <PlusCircle className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">创建智能体</span>
          </button>
          <button
            onClick={() => setActiveTab("myAgents")}
            className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all ${
              activeTab === "myAgents" 
                ? "bg-primary text-white shadow-md" 
                : "hover:bg-white/80"
            }`}
          >
            <Users className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">我的智能体</span>
          </button>
          <button
            onClick={() => setActiveTab("public")}
            className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all ${
              activeTab === "public" 
                ? "bg-primary text-white shadow-md" 
                : "hover:bg-white/80"
            }`}
          >
            <Globe className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">公共智能体</span>
          </button>
          <button
            onClick={() => setActiveTab("worlds")}
            className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all ${
              activeTab === "worlds" 
                ? "bg-primary text-white shadow-md" 
                : "hover:bg-white/80"
            }`}
          >
            <Sparkles className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">世界群组</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {activeTab === "agents" && (
            <CreateAgent 
              onCreateAgent={handleCreateAgent}
              existingAgents={privateAgents}
            />
          )}
          
          {(activeTab === "agents" || activeTab === "myAgents") && (
            <AgentsList 
              agents={privateAgents}
              selectedAgents={selectedAgents}
              onAgentSelect={handleAgentSelect}
              onShareToPublic={handleShareToPublic}
              onDeleteAgent={handleDeleteAgent}
            />
          )}
          
          {activeTab === "public" && (
            <PublicAgents 
              onAddToPrivate={handleCreateAgent}
              sharedAgents={sharedAgents}
            />
          )}
          
          {activeTab === "worlds" && (
            <WorldGroups 
              agents={[...privateAgents, ...sharedAgents]}
            />
          )}
        </div>
        
        {/* Right Column */}
        <div className="space-y-8">
          {activeTab !== "worlds" && (
            <ConversationArea 
              selectedAgents={selectedAgents}
              conversations={conversations}
              onStartConversation={handleStartConversation}
            />
          )}
          
          {activeTab === "agents" && (
            <PublicAgents 
              onAddToPrivate={handleCreateAgent}
              sharedAgents={sharedAgents}
            />
          )}
          
          {activeTab === "myAgents" && (
            <WorldGroups 
              agents={[...privateAgents, ...sharedAgents]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
