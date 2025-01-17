import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface AgentsListProps {
  agents: Agent[];
  selectedAgents: Agent[];
  onAgentSelect: (agent: Agent) => void;
  onShareToPublic?: (agent: Agent) => void;
  onDeleteAgent?: (agent: Agent) => void;
}

export const AgentsList = ({ 
  agents, 
  selectedAgents, 
  onAgentSelect,
  onShareToPublic,
  onDeleteAgent
}: AgentsListProps) => {
  const [slideState, setSlideState] = useState<{ [key: string]: boolean }>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, agentId: string) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, agentId: string) => {
    if (touchStart === null) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (diff > 50) { // 向左滑动超过50px
      setSlideState({ ...slideState, [agentId]: true });
    } else if (diff < -50) { // 向右滑动超过50px
      setSlideState({ ...slideState, [agentId]: false });
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const handleShareToPublic = (agent: Agent) => {
    if (onShareToPublic) {
      onShareToPublic(agent);
      toast.success("成功分享到公共区域");
    }
  };

  const handleDelete = (agent: Agent) => {
    if (onDeleteAgent) {
      onDeleteAgent(agent);
      setSlideState({ ...slideState, [agent.id]: false });
    }
  };

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">我的智能体</h2>
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="relative overflow-hidden"
            onTouchStart={(e) => handleTouchStart(e, agent.id)}
            onTouchMove={(e) => handleTouchMove(e, agent.id)}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`p-3 rounded-md border transition-all transform ${
                slideState[agent.id] ? 'translate-x-[-80px]' : 'translate-x-0'
              } ${
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
            <Button
              variant="destructive"
              size="sm"
              className={`absolute right-0 top-0 h-full rounded-none transition-transform ${
                slideState[agent.id] ? 'translate-x-0' : 'translate-x-full'
              }`}
              onClick={() => handleDelete(agent)}
            >
              删除
            </Button>
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