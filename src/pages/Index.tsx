import { useState } from "react";
import { AgentsList } from "@/components/AgentsList";
import { PublicAgents } from "@/components/PublicAgents";
import { ConversationArea } from "@/components/ConversationArea";
import { CreateAgent } from "@/components/CreateAgent";
import { Agent } from "@/types/agent";

const Index = () => {
  const [privateAgents, setPrivateAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<string[]>([]);

  const handleCreateAgent = (agent: Agent) => {
    setPrivateAgents([...privateAgents, agent]);
    console.log("Created new agent:", agent);
  };

  const handleAgentSelect = (agent: Agent) => {
    if (selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
    console.log("Selected agents updated:", selectedAgents);
  };

  const handleStartConversation = (prompt: string) => {
    // In a real app, this would call the DeepSeek API
    const newConversation = `${selectedAgents.map(a => a.name).join(" and ")} discussed: ${prompt}`;
    setConversations([newConversation, ...conversations]);
    console.log("Started new conversation:", newConversation);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">Emotional Alchemy</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <CreateAgent onCreateAgent={handleCreateAgent} />
          <AgentsList 
            agents={privateAgents}
            selectedAgents={selectedAgents}
            onAgentSelect={handleAgentSelect}
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