import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Agent } from "@/types/agent";

interface CreateAgentProps {
  onCreateAgent: (agent: Agent) => void;
}

export const CreateAgent = ({ onCreateAgent }: CreateAgentProps) => {
  const [name, setName] = useState("");

  const handleCreate = () => {
    const newAgent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || "Auto-generated Name",
      description: "An emotional intelligence agent",
      isPublic: false,
      createdAt: new Date(),
    };
    onCreateAgent(newAgent);
    setName("");
    console.log("Creating new agent:", newAgent);
  };

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">Create New Agent</h2>
      <div className="space-y-4">
        <Input
          placeholder="Agent Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
        />
        <Button onClick={handleCreate} className="w-full">
          Create Agent
        </Button>
      </div>
    </div>
  );
};