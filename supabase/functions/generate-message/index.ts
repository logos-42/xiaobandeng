
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
      timeout: 60000,
    })

    console.log('Making API call to DeepSeek...')
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是${agent.name}，在一个充满无限可能的${theme}世界中。要求根据你的角色特点(${agent.description})生成独特而富有想象力的对话或行动。

要求：
1. 对话或行动必须出人意料，打破常规
2. 可以加入以下元素：
   - 超现实的想象
   - 科幻或魔幻的设定
   - 突发奇想的剧情转折
   - 令人惊喜的能力或道具
3. 要与其他角色产生有趣的互动
4. 完全符合${theme}的世界观，但可以创造性地解释和扩展这个世界
5. 语言要生动活泼，富有个性
6. 每句话都要为故事增添一个意想不到的元素`
          },
          {
            role: "user",
            content: context ? 
              `请根据当前对话记录，生成一段充满创意的${agent.name}的对话或行动。当前对话记录：\n${context}` :
              `作为${agent.name}，请开启一段令人惊喜的对话或行动，在这个${theme}主题的世界中创造独特的故事。`
          }
        ],
        max_tokens: 150,
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

