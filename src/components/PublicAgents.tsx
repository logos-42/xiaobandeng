import { useState } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";

interface PublicAgentsProps {
  onAddToPrivate: (agent: Agent) => void;
}

export const PublicAgents = ({ onAddToPrivate }: PublicAgentsProps) => {
  // Simulated public agents - in a real app, these would come from an API
  const [publicAgents] = useState<Agent[]>([
    {
      id: "pub1",
      name: "Empathy Guide",
      description: "Specializes in understanding complex emotions",
      isPublic: true,
      createdAt: new Date(),
    },
    {
      id: "pub2",
      name: "Wisdom Keeper",
      description: "Shares ancient emotional wisdom",
      isPublic: true,
      createdAt: new Date(),
    },
  ]);

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">Public Agents</h2>
      <div className="space-y-3">
        {publicAgents.map((agent) => (
          <div key={agent.id} className="p-3 rounded-md border hover:border-primary/50 transition-all">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const privateVersion = { ...agent, id: Math.random().toString(36).substr(2, 9), isPublic: false };
                  onAddToPrivate(privateVersion);
                  console.log("Adding public agent to private:", privateVersion);
                }}
              >
                Add to My Agents
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};