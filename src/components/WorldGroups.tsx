
import { useState, useEffect } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WorldGroupChat } from "./WorldGroupChat";
import { CreateWorldGroup } from "./world-groups/CreateWorldGroup";
import { GroupMembers } from "./world-groups/GroupMembers";
import { WorldGroup } from "@/types/world-group";

interface WorldGroupsProps {
  agents: Agent[];
}

export const WorldGroups = ({ agents }: WorldGroupsProps) => {
  const [worldGroups, setWorldGroups] = useState<WorldGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<WorldGroup | null>(null);

  useEffect(() => {
    fetchWorldGroups();
  }, []);

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

  return (
    <div className="agent-card">
      <h2 className="text-xl font-semibold mb-4">世界群组</h2>
      
      <div className="space-y-4">
        <CreateWorldGroup 
          onGroupCreated={(group) => setWorldGroups([group, ...worldGroups])} 
        />

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
                  <GroupMembers 
                    groupId={group.id}
                    allAgents={agents}
                  />

                  <div className="mt-4">
                    <WorldGroupChat
                      groupId={group.id}
                      groupName={group.name}
                      theme={group.theme}
                      agents={agents}
                    />
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
