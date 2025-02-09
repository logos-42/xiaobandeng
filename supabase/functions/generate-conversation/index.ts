
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts"

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Log the request
    const requestTime = new Date().toISOString()
    console.log(`[${requestTime}] Received request`)

    // Validate API key first
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not found in environment variables')
      throw new Error('Configuration error: DeepSeek API key is missing')
    }

    // Parse request body with better error handling
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
      timeout: 30000, // Increased timeout to 30 seconds
    })

    console.log('Making API call to DeepSeek...')
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `你是一个创新的对话生成器。请基于以下智能体的特点，生成一段富有新意的对话：${agents.map((agent: any) => 
            `${agent.name}(${agent.description})`).join(", ")}。对话应该：
            1. 每个角色一句话
            2. 必须以角色名开头，例如"李白：xxxx"
            3. 围绕主题："${prompt}"展开
            4. 保持对话连贯性和趣味性`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
