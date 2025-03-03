
import { useState, useEffect } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WorldGroupChat } from "./WorldGroupChat";
import { CreateWorldGroup } from "./world-groups/CreateWorldGroup";
import { GroupMembers } from "./world-groups/GroupMembers";
import { WorldGroup } from "@/types/world-group";
import { Globe, Settings, Trash2, MessageCircle, UserPlus } from "lucide-react";

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
    <div className="glass-card p-5">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        世界群组
      </h2>
      
      <div className="space-y-4">
        <CreateWorldGroup 
          onGroupCreated={(group) => setWorldGroups([group, ...worldGroups])} 
        />

        <div className="space-y-3">
          {worldGroups.map((group) => (
            <div key={group.id} className="agent-item overflow-visible">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center text-white">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">主题：{group.theme}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                    className="border-primary/20 hover:border-primary/30"
                  >
                    {selectedGroup?.id === group.id ? (
                      <>
                        <Settings className="mr-1 h-4 w-4" /> 收起
                      </>
                    ) : (
                      <>
                        <Settings className="mr-1 h-4 w-4" /> 管理
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteWorldGroup(group.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> 删除
                  </Button>
                </div>
              </div>

              {selectedGroup?.id === group.id && (
                <div className="mt-4 space-y-3 border-t pt-4 border-dashed">
                  <div className="bg-white/50 p-3 rounded-lg border">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                      <UserPlus className="h-4 w-4 text-primary" /> 群组成员
                    </h4>
                    <GroupMembers 
                      groupId={group.id}
                      allAgents={agents}
                    />
                  </div>

                  <div className="bg-white/50 p-3 rounded-lg border">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                      <MessageCircle className="h-4 w-4 text-primary" /> 群组聊天
                    </h4>
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

          {worldGroups.length === 0 && (
            <div className="text-center py-8 border border-dashed rounded-xl border-muted-foreground/30">
              <p className="text-muted-foreground mb-2">
                还没有世界群组。创建一个开始探索吧！
              </p>
              <Globe className="h-8 w-8 mx-auto text-muted-foreground/50" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
