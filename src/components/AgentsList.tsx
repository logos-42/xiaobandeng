import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";

interface AgentsListProps {
  agents: Agent[];
  selectedAgents: Agent[];
  onAgentSelect: (agent: Agent) => void;
}

export const AgentsList = ({ agents, selectedAgents, onAgentSelect }: AgentsListProps) => {
  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">My Agents</h2>
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-3 rounded-md border transition-all ${
              selectedAgents.find(a => a.id === agent.id)
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </div>
              <Button
                variant={selectedAgents.find(a => a.id === agent.id) ? "secondary" : "outline"}
                size="sm"
                onClick={() => onAgentSelect(agent)}
              >
                {selectedAgents.find(a => a.id === agent.id) ? "Selected" : "Select"}
              </Button>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No agents yet. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
};