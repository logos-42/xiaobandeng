
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConversationInputProps {
  onSubmit: (prompt: string) => void;
  isDisabled: boolean;
  isLoading: boolean;
}

export const ConversationInput = ({
  onSubmit,
  isDisabled,
  isLoading,
}: ConversationInputProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt.trim());
      setPrompt("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="输入你的情感提示..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        className="flex-1"
      />
      <Button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isDisabled}
      >
        {isLoading ? "生成中..." : "开始对话"}
      </Button>
    </div>
  );
};
