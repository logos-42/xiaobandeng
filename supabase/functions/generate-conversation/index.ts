
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
  console.log(`[${requestTime}] Function started`)

  // Handle CORS preflight requests
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
      console.error('Configuration error: DeepSeek API key is missing')
      throw new Error('Configuration error: DeepSeek API key is missing')
    }

    let requestData;
    try {
      requestData = await req.json()
      console.log('Request data:', JSON.stringify(requestData))
    } catch (e) {
      console.error('Failed to parse request JSON:', e)
      throw new Error('Invalid request format: Unable to parse JSON')
    }

    const { agents, prompt } = requestData
    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      console.error('Invalid request - missing or empty agents array:', requestData)
      throw new Error('Invalid request: Missing or empty agents array')
    }

    console.log('Generating conversation for agents:', agents.map((a: any) => a.name).join(', '))
    console.log('Prompt:', prompt)
    
    const openai = new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
      timeout: 180000, // 3 minutes timeout
    })

    console.log('Making API call to DeepSeek...')
    try {
      const completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个独特而富有想象力的对话生成器。请基于以下角色的特点，创造一段令人惊叹的未来科幻或奇幻互动场景：${agents.map((agent: any) => 
              `${agent.name}(${agent.description})`).join(", ")}。

要求创造一个充满神奇和新奇的对话场景:
1. 每个角色必须发言，格式为"角色名：xxx"
2. 对话内容必须包含以下几个要素:
   - 超现实或科幻的场景和背景设定
   - 出人意料的情节转折或冲突
   - 独特而富有创意的道具或能力
   - 令人惊喜的互动效果
3. 情节发展要出人意料:
   - 加入不合常理但有趣的剧情安排
   - 打破传统叙事，创造令人惊叹的效果
   - 融入荒诞或幽默的元素
4. 对话要生动有趣:
   - 展现角色独特的性格特征
   - 语言风格要活泼、幽默
   - 对白要富有张力和想象力
5. 整体氛围要充满想象力和新奇感，让读者感到耳目一新`
          },
          {
            role: "user",
            content: prompt || "请创造一个令人惊喜的对话场景"
          }
        ],
        max_tokens: 800,
        temperature: 0.9,
      })

      console.log('Received response from DeepSeek')

      if (!completion.choices?.[0]?.message?.content) {
        console.error('No content in DeepSeek response:', completion)
        throw new Error('No content generated from DeepSeek API')
      }

      const content = completion.choices[0].message.content
      console.log('Generated content:', content)

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
    } catch (apiError) {
      console.error('DeepSeek API error:', apiError)
      throw new Error(`DeepSeek API error: ${apiError.message}`)
    }

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
