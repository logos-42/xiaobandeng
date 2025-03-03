
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { UserCircle, Share2, Trash2, Check, Sparkles } from "lucide-react";

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

  const isSelected = (agentId: string) => 
    selectedAgents.some(agent => agent.id === agentId);

  return (
    <div className="glass-card p-5">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <UserCircle className="h-5 w-5 text-primary" />
        我的智能体
      </h2>
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
              className={`transition-all transform ${
                slideState[agent.id] ? 'translate-x-[-100px]' : 'translate-x-0'
              } ${
                isSelected(agent.id)
                  ? "agent-item agent-selected"
                  : "agent-item"
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isSelected(agent.id) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onAgentSelect(agent)}
                    className={isSelected(agent.id) 
                      ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-primary/20 hover:border-primary/30"
                    }
                  >
                    {isSelected(agent.id) ? (
                      <span className="flex items-center">
                        <Check className="mr-1 h-4 w-4" /> 已选择
                      </span>
                    ) : "选择"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareToPublic(agent)}
                    className="border-primary/20 hover:border-primary/30"
                  >
                    <Share2 className="mr-1 h-4 w-4" /> 分享
                  </Button>
                </div>
              </div>
              {isSelected(agent.id) && (
                <div className="absolute top-0 right-0 h-6 w-6 bg-primary text-white rounded-bl-lg flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              className={`absolute right-0 top-0 h-full rounded-none transition-transform ${
                slideState[agent.id] ? 'translate-x-0' : 'translate-x-full'
              }`}
              onClick={() => handleDelete(agent)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-xl border-muted-foreground/30">
            <p className="text-muted-foreground mb-2">
              还没有智能体。创建一个开始对话吧！
            </p>
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50" />
          </div>
        )}
      </div>
    </div>
  );
};
