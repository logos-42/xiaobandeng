
import { useState, useRef } from "react";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useConversationGeneration = (groupId: string, groupMembers: Agent[]) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const generationIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const minRequestInterval = 15000;

  const calculateRetryDelay = (retryCount: number) => {
    const baseDelay = 5000;
    const maxDelay = 30000;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    return Math.min(exponentialDelay, maxDelay);
  };

  const cleanupTimers = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
    }
  };

  const scheduleNextGeneration = (delay: number = calculateRetryDelay(retryCount)) => {
    if (!isPaused) {
      console.log(`Scheduling next generation in ${delay}ms`);
      cleanupTimers();
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(0);
        generateNewConversation();
      }, delay);
    }
  };

  const generateNewConversation = async () => {
    if (isGenerating || isPaused || groupMembers.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime < minRequestInterval) {
      console.log("Skipping request due to rate limiting");
      return;
    }
    
    setIsGenerating(true);
    setLastRequestTime(now);

    try {
      console.log("Generating new conversation with members:", groupMembers);
      const { data: generatedData, error: functionError } = await supabase.functions.invoke('generate-conversation', {
        body: {
          agents: groupMembers,
          prompt: `继续故事情节`
        }
      });

      if (functionError) throw functionError;
      
      if (generatedData.choices && generatedData.choices[0]) {
        const content = generatedData.choices[0].message.content;
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          const agentMatch = groupMembers.find(agent => 
            line.toLowerCase().startsWith(agent.name.toLowerCase())
          );
          
          if (agentMatch) {
            const { error } = await supabase
              .from('world_conversations')
              .insert([{
                world_group_id: groupId,
                agent_id: agentMatch.id,
                content: line.substring(agentMatch.name.length + 1).trim()
              }]);

            if (error) {
              console.error('Error inserting conversation:', error);
              continue;
            }
          }
        }
        setRetryCount(0);
        scheduleNextGeneration(minRequestInterval);
      }
    } catch (error) {
      console.error('Error generating conversation:', error);
      
      if (retryCount < maxRetries) {
        const nextRetryDelay = calculateRetryDelay(retryCount);
        console.log(`Retry attempt ${retryCount + 1} scheduled in ${nextRetryDelay}ms`);
        setRetryCount(prev => prev + 1);
        scheduleNextGeneration(nextRetryDelay);
      } else {
        toast.error("生成对话失败，已达到最大重试次数");
        setIsPaused(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const startGenerationCycle = () => {
    generateNewConversation();
    generationIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (!isGenerating && !isPaused && (now - lastRequestTime) >= minRequestInterval) {
        generateNewConversation();
      }
    }, minRequestInterval);
  };

  const stopGenerationCycle = () => {
    cleanupTimers();
  };

  return {
    isGenerating,
    isPaused,
    setIsPaused,
    startGenerationCycle,
    stopGenerationCycle,
    cleanupTimers
  };
};
