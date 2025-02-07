
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GroupMembersProps {
  groupId: string;
  allAgents: Agent[];
}

export const GroupMembers = ({ groupId, allAgents }: GroupMembersProps) => {
  const [groupAgents, setGroupAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetchGroupAgents();
  }, [groupId]);

  const fetchGroupAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('world_group_agents')
        .select('agent_id')
        .eq('world_group_id', groupId);

      if (error) throw error;

      const agentIds = data.map(row => row.agent_id);
      const members = allAgents.filter(agent => agentIds.includes(agent.id));
      setGroupAgents(members);
    } catch (error) {
      console.error('Error fetching group agents:', error);
      toast.error("获取群组智能体失败");
    }
  };

  const addAgentToGroup = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('world_group_agents')
        .insert([
          { world_group_id: groupId, agent_id: agent.id }
        ]);

      if (error) throw error;

      setGroupAgents([...groupAgents, agent]);
      toast.success(`${agent.name} 已加入群组`);
    } catch (error) {
      console.error('Error adding agent to group:', error);
      toast.error("添加智能体失败");
    }
  };

  const removeAgentFromGroup = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('world_group_agents')
        .delete()
        .eq('world_group_id', groupId)
        .eq('agent_id', agent.id);

      if (error) throw error;

      setGroupAgents(groupAgents.filter(a => a.id !== agent.id));
      toast.success(`${agent.name} 已退出群组`);
    } catch (error) {
      console.error('Error removing agent from group:', error);
      toast.error("移除智能体失败");
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-secondary/20 rounded-md">
        <h4 className="font-medium mb-2">群组成员</h4>
        <div className="space-y-2">
          {groupAgents.map((agent) => (
            <div key={agent.id} className="flex justify-between items-center">
              <span>{agent.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeAgentFromGroup(agent)}
              >
                退出群组
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-secondary/20 rounded-md">
        <h4 className="font-medium mb-2">可邀请的智能体</h4>
        <div className="space-y-2">
          {allAgents
            .filter(agent => !groupAgents.find(a => a.id === agent.id))
            .map((agent) => (
              <div key={agent.id} className="flex justify-between items-center">
                <span>{agent.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addAgentToGroup(agent)}
                >
                  邀请加入
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
