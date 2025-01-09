import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentsListProps {
  agents: Agent[];
  selectedAgents: Agent[];
  onAgentSelect: (agent: Agent) => void;
  onShareToPublic?: (agent: Agent) => void;
}

export const AgentsList = ({ 
  agents, 
  selectedAgents, 
  onAgentSelect,
  onShareToPublic 
}: AgentsListProps) => {
  const handleShareToPublic = (agent: Agent) => {
    if (onShareToPublic) {
      onShareToPublic(agent);
      toast.success("成功分享到公共区域");
    }
  };

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">我的智能体</h2>
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
              <div className="flex gap-2">
                <Button
                  variant={selectedAgents.find(a => a.id === agent.id) ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => onAgentSelect(agent)}
                >
                  {selectedAgents.find(a => a.id === agent.id) ? "已选择" : "选择"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareToPublic(agent)}
                >
                  分享到公共区域
                </Button>
              </div>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            还没有智能体。创建一个开始对话吧！
          </p>
        )}
      </div>
    </div>
  );
};