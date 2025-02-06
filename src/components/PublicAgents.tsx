import { useState } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PublicAgentsProps {
  onAddToPrivate: (agent: Agent) => void;
  sharedAgents?: Agent[];
}

export const PublicAgents = ({ onAddToPrivate, sharedAgents = [] }: PublicAgentsProps) => {
  const [slideState, setSlideState] = useState<{ [key: string]: boolean }>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, agentId: string) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, agentId: string) => {
    if (touchStart === null) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (diff > 50) {
      setSlideState({ ...slideState, [agentId]: true });
    } else if (diff < -50) {
      setSlideState({ ...slideState, [agentId]: false });
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const handleAddToPrivate = (agent: Agent) => {
    const privateVersion = { 
      ...agent, 
      id: Math.random().toString(36).substr(2, 9), 
      isPublic: false 
    };
    onAddToPrivate(privateVersion);
    console.log("添加公共智能体到私有列表:", privateVersion);
  };

  const handleDelete = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agent.id);

      if (error) throw error;
      toast.success("成功删除公共智能体");
      // 刷新页面以更新列表
      window.location.reload();
    } catch (error) {
      console.error('Error deleting public agent:', error);
      toast.error("删除公共智能体失败");
    }
  };

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">公共智能体</h2>
      <div className="space-y-3">
        {sharedAgents.map((agent) => (
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
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddToPrivate(agent)}
                >
                  添加到我的智能体
                </Button>
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
        {sharedAgents.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            暂无公共智能体可用
          </p>
        )}
      </div>
    </div>
  );
};