
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
    // Validate API key first
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not found in environment variables')
      throw new Error('Configuration error: DeepSeek API key is missing')
    }

    // Parse request body
    const body = await req.text()
    console.log('Received request body:', body)
    
    let requestData
    try {
      requestData = JSON.parse(body)
    } catch (e) {
      console.error('Failed to parse request JSON:', e)
      throw new Error('Invalid request format: Unable to parse JSON')
    }

    // Validate request data
    const { agent, context, theme } = requestData
    if (!agent || !agent.name) {
      throw new Error('Invalid request: Missing agent information')
    }

    console.log('Processing request for agent:', agent.name)
    console.log('Context:', context)
    console.log('Theme:', theme)
    
    // Initialize OpenAI client with DeepSeek configuration
    const openai = new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    })

    // Make API call
    console.log('Making API call to DeepSeek...')
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
      max_tokens: 500,  // Reduced from 1000 to help with potential timeout issues
      temperature: 0.7,
    })

    console.log('Received response from DeepSeek')
    const content = completion.choices[0]?.message?.content
    console.log('Generated content:', content)

    // Return response
    return new Response(
      JSON.stringify({
        choices: [{
          message: {
            content: content || '对不起，我暂时无法生成回应。'
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
    console.error('Error in generate-message function:', error)
    
    let errorMessage = 'Failed to generate message'
    let errorDetails = error.toString()

    // Try to extract more detailed error information
    try {
      if (error.response) {
        const responseText = await error.response.text()
        console.error('DeepSeek API error response:', responseText)
        errorMessage = `DeepSeek API Error: ${responseText}`
      }
    } catch (e) {
      console.error('Error processing error response:', e)
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
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
