
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts"

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
    
    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: DEEPSEEK_API_KEY || '',
    })

    const completion = await openai.chat.completions.create({
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

    console.log('Generated response:', completion)
    
    return new Response(JSON.stringify(completion), {
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
