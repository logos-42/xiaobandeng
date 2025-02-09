
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts"

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  const requestTime = new Date().toISOString()
  console.log(`[${requestTime}] Received request`)

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not found in environment variables')
      throw new Error('Configuration error: DeepSeek API key is missing')
    }

    let requestData
    try {
      requestData = await req.json()
      console.log('Request data:', JSON.stringify(requestData))
    } catch (e) {
      console.error('Failed to parse request JSON:', e)
      throw new Error('Invalid request format: Unable to parse JSON')
    }

    const { agents, prompt } = requestData
    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      throw new Error('Invalid request: Missing or empty agents array')
    }

    console.log('Generating conversation for agents:', agents.map((a: any) => a.name).join(', '))
    console.log('Prompt:', prompt)
    
    const openai = new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
      timeout: 60000,
    })

    console.log('Making API call to DeepSeek...')
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `你是一个独特的对话生成器。请基于以下角色特点，生成一段充满创意和想象力的对话：${agents.map((agent: any) => 
            `${agent.name}(${agent.description})`).join(", ")}。

对话要求：
1. 每个角色必须说一句话，以角色名开头，如"李白：xxx"
2. 围绕主题："${prompt}"展开，但要加入意想不到的转折和惊喜
3. 对话内容要体现以下特点：
   - 加入奇思妙想和超现实元素
   - 可以打破常规，融入科幻、魔幻或搞笑元素
   - 角色之间的互动要出人意料
   - 避免平淡的日常对话
4. 语言风格要生动有趣，可以适当夸张
5. 每句话都要推进剧情，制造悬念或笑点`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.9,
    })

    console.log('Received response from DeepSeek')
    const content = completion.choices[0]?.message?.content
    console.log('Generated content:', content)

    if (!content) {
      throw new Error('No content generated from DeepSeek API')
    }

    return new Response(
      JSON.stringify({
        choices: [{
          message: {
            content
          }
        }]
      }),
      {
        headers: corsHeaders
      }
    )

  } catch (error) {
    console.error('Error in generate-conversation function:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Failed to generate conversation',
        details: error.toString()
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
})

