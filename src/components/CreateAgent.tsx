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

  const handleCreate = () => {
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
    onCreateAgent(newAgent);
    setName("");
    toast.success("成功创建新智能体");
    console.log("创建新智能体:", newAgent);
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
        />
        <Button onClick={handleCreate} className="w-full">
          创建智能体
        </Button>
      </div>
    </div>
  );
};