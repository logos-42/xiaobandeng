
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { WorldGroup, Theme } from "@/types/world-group";
import { toast } from "sonner";

interface CreateWorldGroupProps {
  onGroupCreated: (group: WorldGroup) => void;
}

export const CreateWorldGroup = ({ onGroupCreated }: CreateWorldGroupProps) => {
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string>("");

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

      onGroupCreated(data);
      setNewGroupName("");
      setSelectedTheme("");
      toast.success("创建世界群组成功");
    } catch (error) {
      console.error('Error creating world group:', error);
      toast.error("创建世界群组失败");
    }
  };

  return (
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
  );
};
