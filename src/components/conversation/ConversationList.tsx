
interface ConversationListProps {
  conversations: string[];
}

export const ConversationList = ({ conversations }: ConversationListProps) => {
  if (conversations.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        选择智能体并开始对话，看看会发生什么神奇的事情！
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
      {conversations.map((conversation, index) => (
        <div key={index} className="p-4 rounded-lg bg-secondary/20">
          <p className="whitespace-pre-wrap">{conversation}</p>
        </div>
      ))}
    </div>
  );
};
