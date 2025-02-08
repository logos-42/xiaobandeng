
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

    const { agents, prompt } = requestData
    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      throw new Error('Invalid request: Missing or empty agents array')
    }

    console.log('Generating conversation for agents:', agents.map((a: any) => a.name).join(', '))
    console.log('Prompt:', prompt)
    
    const openai = new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    })

    console.log('Making API call to DeepSeek...')
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
      max_tokens: 1000,
      temperature: 0.7
    })

    console.log('Received response from DeepSeek')
    const content = completion.choices[0]?.message?.content
    console.log('Generated content:', content)

    return new Response(
      JSON.stringify({
        choices: [{
          message: {
            content: content || '对不起，我暂时无法生成对话。'
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
    
    let errorMessage = 'Failed to generate conversation'
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
