import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Agent } from "@/types/agent";
import { toast } from "sonner";

interface CreateAgentProps {
  onCreateAgent: (agent: Agent) => void;
  existingAgents: Agent[];
}

export const CreateAgent = ({ onCreateAgent, existingAgents }: CreateAgentProps) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      
      if (name && existingAgents.some(agent => agent.name === name)) {
        toast.error("已存在同名智能体");
        return;
      }

      const newAgent: Agent = {
        id: Math.random().toString(36).substr(2, 9),
        name: name || "自动生成的名称",
        description: "一个情感智能体",
        isPublic: false,
        createdAt: new Date(),
      };

      console.log("Creating new agent:", newAgent);
      await onCreateAgent(newAgent);
      setName("");
      toast.success("成功创建新智能体");
      
    } catch (error) {
      console.error("Error in handleCreate:", error);
      toast.error("创建智能体失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">创建新智能体</h2>
      <div className="space-y-4">
        <Input
          placeholder="智能体名称（可选）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
          disabled={isSubmitting}
        />
        <Button 
          onClick={handleCreate} 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "创建中..." : "创建智能体"}
        </Button>
      </div>
    </div>
  );
};