
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

    // Parse request body with better error handling
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate request data structure
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing request for agent:', agent.name)
    console.log('Context:', context)
    console.log('Theme:', theme)
    
    // Initialize OpenAI client with DeepSeek configuration
    const openai = new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
      timeout: 8000, // 8 second timeout
    })

    // Make API call with shorter timeout
    console.log('Making API call to DeepSeek...')
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `你是${agent.name}，在一个${theme}世界观的故事中。根据你的角色特点(${agent.description})生成对话或行动。要求：
          1. 对话要简短且富有创意
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
      max_tokens: 200,
      temperature: 0.7,
    })

    console.log('Received response from DeepSeek')
    const content = completion?.choices[0]?.message?.content
    console.log('Generated content:', content)

    if (!content) {
      console.error('No content in DeepSeek response:', completion)
      throw new Error('No content generated from DeepSeek API')
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        choices: [{
          message: {
            content: content
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
