import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: NextRequest) {
  const { text } = await request.json()

  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Rephrase the following text to correct any grammatical errors and improve clarity:"
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    })

    const rephrasedText = chatCompletion.choices[0]?.message?.content || ''

    return NextResponse.json({ text: rephrasedText })
  } catch (error) {
    console.error('Rephrasing error:', error)
    return NextResponse.json({ error: 'Rephrasing failed' }, { status: 500 })
  }
}