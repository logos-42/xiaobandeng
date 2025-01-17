import { useState, useEffect } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PublicAgentsProps {
  onAddToPrivate: (agent: Agent) => void;
  sharedAgents?: Agent[];
}

export const PublicAgents = ({ onAddToPrivate, sharedAgents = [] }: PublicAgentsProps) => {
  const handleAddToPrivate = (agent: Agent) => {
    const privateVersion = { 
      ...agent, 
      id: Math.random().toString(36).substr(2, 9), 
      isPublic: false 
    };
    onAddToPrivate(privateVersion);
    console.log("添加公共智能体到私有列表:", privateVersion);
  };

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">公共智能体</h2>
      <div className="space-y-3">
        {sharedAgents.map((agent) => (
          <div key={agent.id} className="p-3 rounded-md border hover:border-primary/50 transition-all">
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