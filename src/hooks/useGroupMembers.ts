
import { useState } from "react";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useGroupMembers = (groupId: string, agents: Agent[]) => {
  const [groupMembers, setGroupMembers] = useState<Agent[]>([]);

  const fetchGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('world_group_agents')
        .select('agent_id')
        .eq('world_group_id', groupId);

      if (error) throw error;

      const memberIds = data.map(item => item.agent_id);
      const groupMemberAgents = agents.filter(agent => memberIds.includes(agent.id));
      
      const uniqueMembers = groupMemberAgents.filter((member, index, self) =>
        index === self.findIndex((m) => m.id === member.id)
      );

      console.log("Group members:", uniqueMembers);
      setGroupMembers(uniqueMembers);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast.error("获取群组成员失败");
    }
  };

  return { groupMembers, fetchGroupMembers };
};
