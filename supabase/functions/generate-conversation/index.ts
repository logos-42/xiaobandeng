
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { agents, prompt } = await req.json()
    console.log('Generating conversation for agents:', agents.map((a: any) => a.name).join(', '))
    console.log('Prompt:', prompt)
    
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个创新的对话生成器。请基于以下智能体的特点，生成一段富有新意的对话：${agents.map((agent: any) => 
              `${agent.name}(${agent.description})`).join(", ")}。对话应该围绕主题："${prompt}"展开，保持新颖性和创意性。`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.8
      })
    })

    const data = await response.json()
    console.log('Generated response:', data)
    
    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
    })
  } catch (error) {
    console.error('Error generating conversation:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
    })
  }
})
