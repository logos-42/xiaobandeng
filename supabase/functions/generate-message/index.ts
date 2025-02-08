
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
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not found in environment variables');
      throw new Error('DeepSeek API key is not configured');
    }

    const { agent, context, theme } = await req.json()
    console.log('Generating message for agent:', agent.name)
    console.log('Context:', context)
    
    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: DEEPSEEK_API_KEY,
    });

    console.log('Making API call to DeepSeek...');
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
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
      max_tokens: 2000,
      temperature: 0.8
    });

    console.log('DeepSeek API response received:', completion);
    
    return new Response(JSON.stringify(completion), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
    })
  } catch (error) {
    console.error('Error generating message:', error);
    // Include more detailed error information
    let errorMessage = error.message;
    if (error.response) {
      // If there's a response from DeepSeek API, include it
      errorMessage = `DeepSeek API Error: ${await error.response.text()}`;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.toString()
    }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
    })
  }
})
