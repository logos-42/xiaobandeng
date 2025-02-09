
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
      console.log('Received request data:', JSON.stringify(requestData))
    } catch (e) {
      console.error('Failed to parse request JSON:', e)
      return new Response(
        JSON.stringify({
          error: 'Invalid request format',
          details: 'Unable to parse JSON body'
        }),
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    const { agent, context, theme } = requestData
    if (!agent || !agent.name) {
      console.error('Invalid request - missing agent information:', requestData)
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: 'Missing required agent information'
        }),
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    console.log('Processing request for agent:', agent.name)
    console.log('Context:', context)
    console.log('Theme:', theme)
    
    const openai = new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
      timeout: 120000, // Increased timeout to 120 seconds
    })

    console.log('Making API call to DeepSeek...')
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是${agent.name}，存在于一个充满无限可能的${theme}世界。要求根据你的角色特点(${agent.description})生成一段极具想象力和创意的对话或行动。

创作要求：
1. 情节必须出人意料，包含以下元素：
   - 不合常理但有趣的剧情发展
   - 超现实或科幻的场景描写
   - 独特而新颖的能力或道具运用
   - 出乎意料的情节转折
2. 互动效果要令人惊叹：
   - 打破传统叙事方式
   - 创造令人惊喜的效果
   - 展现独特的角色魅力
3. 场景描写要充满想象力：
   - 融入奇幻或科技元素
   - 创造独特的世界观
   - 加入新颖的设定
4. 语言风格要活泼生动：
   - 对白要富有张力
   - 加入幽默或荒诞元素
   - 展现角色个性
5. 每一个行动或对话都要为故事带来意想不到的发展`
          },
          {
            role: "user",
            content: context ? 
              `请根据当前对话记录，续写一段充满创意的${agent.name}的对话或行动。当前对话：\n${context}` :
              `作为${agent.name}，请展开一段令人惊叹的对话或行动，在这个${theme}主题的世界中创造独特的故事。`
          }
        ],
        max_tokens: 500,
        temperature: 0.9,
      })
    } catch (apiError) {
      console.error('DeepSeek API call failed:', apiError)
      throw new Error(`DeepSeek API error: ${apiError.message}`)
    }

    console.log('Received response from DeepSeek')
    const content = completion?.choices[0]?.message?.content
    console.log('Generated content:', content)

    if (!content) {
      console.error('No content in DeepSeek response:', completion)
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
    console.error('Error in generate-message function:', error)
    
    let errorMessage = 'Failed to generate message'
    let errorDetails = error.toString()

    if (error.response) {
      try {
        const responseText = await error.response.text()
        console.error('DeepSeek API error response:', responseText)
        errorMessage = `DeepSeek API Error: ${responseText}`
      } catch (e) {
        console.error('Error processing error response:', e)
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
})
