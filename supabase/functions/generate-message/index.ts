
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

    const body = await req.text();
    console.log('Request body:', body);
    
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (e) {
      console.error('Error parsing request JSON:', e);
      throw new Error('Invalid JSON in request body');
    }

    const { agent, context, theme } = requestData;
    
    if (!agent || !agent.name) {
      throw new Error('Invalid request: missing agent information');
    }

    console.log('Generating message for agent:', agent.name);
    console.log('Context:', context);
    console.log('Theme:', theme);
    
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

    console.log('DeepSeek API response received');
    console.log('Response content:', completion.choices[0]?.message?.content);
    
    return new Response(JSON.stringify({
      choices: [{
        message: {
          content: completion.choices[0]?.message?.content || '对不起，我暂时无法生成回应。'
        }
      }]
    }), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
    })
  } catch (error) {
    console.error('Error generating message:', error);
    let errorMessage = 'An error occurred while generating the message';
    let errorDetails = error.toString();

    try {
      if (error.response) {
        const responseText = await error.response.text();
        console.error('DeepSeek API error response:', responseText);
        errorMessage = `DeepSeek API Error: ${responseText}`;
      }
    } catch (e) {
      console.error('Error processing error response:', e);
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
    })
  }
})
