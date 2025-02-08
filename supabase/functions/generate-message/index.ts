
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')

serve(async (req) => {
  try {
    const { agent, context, theme } = await req.json()
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: `你是${agent.name}，在一个${theme}世界观的故事中。根据你的角色特点(${agent.description})生成对话或行动。要求：
            1. 对话要有趣且富有创意
            2. 要继续推进故事发展
            3. 要与其他角色互动
            4. 符合${theme}的世界观设定`
          },
          {
            role: "user",
            content: context ? 
              `请根据当前对话记录，生成一段${agent.name}的对话或行动。当前对话记录：\n${context}` :
              `作为${agent.name}，请开启一段新的对话或行动，展开这个${theme}主题的故事。`
          }
        ],
        max_tokens: 1000,
        temperature: 0.8
      })
    })

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
