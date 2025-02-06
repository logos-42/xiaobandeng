import { useState, useEffect } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WorldGroup {
  id: string;
  name: string;
  theme: string;
  description: string | null;
  created_at: string;
}

interface WorldGroupsProps {
  agents: Agent[];
}

export const WorldGroups = ({ agents }: WorldGroupsProps) => {
  const [worldGroups, setWorldGroups] = useState<WorldGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<WorldGroup | null>(null);
  const [groupAgents, setGroupAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetchWorldGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupAgents(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchWorldGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('world_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorldGroups(data || []);
    } catch (error) {
      console.error('Error fetching world groups:', error);
      toast.error("获取世界群组失败");
    }
  };

  const fetchGroupAgents = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('world_group_agents')
        .select('agent_id')
        .eq('world_group_id', groupId);

      if (error) throw error;

      const agentIds = data.map(row => row.agent_id);
      const groupAgents = agents.filter(agent => agentIds.includes(agent.id));
      setGroupAgents(groupAgents);
    } catch (error) {
      console.error('Error fetching group agents:', error);
      toast.error("获取群组智能体失败");
    }
  };

  const createWorldGroup = async () => {
    if (!newGroupName || !selectedTheme) {
      toast.error("请填写群组名称和选择世界观主题");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('world_groups')
        .insert([
          { name: newGroupName, theme: selectedTheme }
        ])
        .select()
        .single();

      if (error) throw error;

      setWorldGroups([data, ...worldGroups]);
      setNewGroupName("");
      setSelectedTheme("");
      toast.success("创建世界群组成功");
    } catch (error) {
      console.error('Error creating world group:', error);
      toast.error("创建世界群组失败");
    }
  };

  const deleteWorldGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('world_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      setWorldGroups(worldGroups.filter(group => group.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      toast.success("删除世界群组成功");
    } catch (error) {
      console.error('Error deleting world group:', error);
      toast.error("删除世界群组失败");
    }
  };

  const addAgentToGroup = async (groupId: string, agent: Agent) => {
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

  const removeAgentFromGroup = async (groupId: string, agent: Agent) => {
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
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">世界群组</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="输入群组名称..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <Select value={selectedTheme} onValueChange={setSelectedTheme}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择世界观主题" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="玄幻">玄幻</SelectItem>
              <SelectItem value="科幻">科幻</SelectItem>
              <SelectItem value="言情">言情</SelectItem>
              <SelectItem value="武侠">武侠</SelectItem>
              <SelectItem value="都市">都市</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={createWorldGroup}>创建群组</Button>
        </div>

        <div className="space-y-3">
          {worldGroups.map((group) => (
            <div key={group.id} className="p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">主题：{group.theme}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                  >
                    {selectedGroup?.id === group.id ? "收起" : "管理"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteWorldGroup(group.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>

              {selectedGroup?.id === group.id && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-secondary/20 rounded-md">
                    <h4 className="font-medium mb-2">群组成员</h4>
                    <div className="space-y-2">
                      {groupAgents.map((agent) => (
                        <div key={agent.id} className="flex justify-between items-center">
                          <span>{agent.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAgentFromGroup(group.id, agent)}
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
                      {agents
                        .filter(agent => !groupAgents.find(a => a.id === agent.id))
                        .map((agent) => (
                          <div key={agent.id} className="flex justify-between items-center">
                            <span>{agent.name}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addAgentToGroup(group.id, agent)}
                            >
                              邀请加入
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};