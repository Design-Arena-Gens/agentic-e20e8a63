import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a helpful AI call agent assistant. You handle customer calls professionally and courteously.

Your responsibilities:
- Answer questions clearly and concisely
- Help customers with inquiries about products, services, or support
- Schedule appointments or take messages when needed
- Provide helpful information and guidance
- Be empathetic and understanding
- Keep responses conversational and natural for voice interaction
- Keep responses brief (1-3 sentences) since they will be spoken aloud

Remember: You're in a voice call, so keep your responses concise and easy to understand when spoken.`

interface Message {
  role: 'user' | 'agent'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    const conversationHistory = history.map((msg: Message) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Simulate AI response (replace with actual OpenAI API call if you have an API key)
    const response = await generateResponse(message, conversationHistory)

    return NextResponse.json({
      response,
      audio: null // Could add ElevenLabs or OpenAI TTS here
    })
  } catch (error) {
    console.error('Error in agent route:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function generateResponse(message: string, history: any[]): Promise<string> {
  // Check if OpenAI API key is available
  const apiKey = process.env.OPENAI_API_KEY

  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: message }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0].message.content
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }
  }

  // Fallback to rule-based responses
  return generateFallbackResponse(message)
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Greetings
  if (lowerMessage.match(/\b(hello|hi|hey|good morning|good afternoon)\b/)) {
    return "Hello! How can I assist you today?"
  }

  // Help requests
  if (lowerMessage.match(/\b(help|assist|support)\b/)) {
    return "I'm here to help! I can answer questions, provide information, or connect you with the right department. What do you need assistance with?"
  }

  // Hours/availability
  if (lowerMessage.match(/\b(hours|open|available|time)\b/)) {
    return "We're available 24/7 through this AI agent. For specific department hours, please let me know which department you're interested in."
  }

  // Pricing
  if (lowerMessage.match(/\b(price|cost|fee|charge)\b/)) {
    return "I'd be happy to discuss pricing with you. Could you tell me which specific product or service you're interested in?"
  }

  // Appointment
  if (lowerMessage.match(/\b(appointment|schedule|book|meeting)\b/)) {
    return "I can help you schedule an appointment. What date and time works best for you?"
  }

  // Contact
  if (lowerMessage.match(/\b(contact|reach|speak|talk to|representative)\b/)) {
    return "You can reach our team at support@example.com or I can transfer you to a human representative. Would you like me to do that?"
  }

  // Thank you
  if (lowerMessage.match(/\b(thank|thanks)\b/)) {
    return "You're welcome! Is there anything else I can help you with today?"
  }

  // Goodbye
  if (lowerMessage.match(/\b(bye|goodbye|see you|end call)\b/)) {
    return "Thank you for calling! Have a great day. Feel free to reach out anytime you need assistance."
  }

  // Status/order
  if (lowerMessage.match(/\b(order|status|tracking|delivery)\b/)) {
    return "I can help you check on your order status. Could you please provide your order number?"
  }

  // Problem/issue
  if (lowerMessage.match(/\b(problem|issue|not working|broken|error)\b/)) {
    return "I'm sorry to hear you're experiencing an issue. Can you describe the problem in more detail so I can better assist you?"
  }

  // Default response
  return "I understand. Could you provide a bit more detail so I can better assist you with your request?"
}
