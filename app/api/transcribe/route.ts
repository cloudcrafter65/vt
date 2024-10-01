import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { Readable } from 'stream'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not set in the environment variables' }, { status: 500 })
  }

  const formData = await request.formData()
  const audio = formData.get('audio') as File | null

  if (!audio) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await audio.arrayBuffer())
    const stream = Readable.from(buffer)

    const transcription = await groq.audio.transcriptions.create({
      file: {
        file: stream,
        filename: audio.name,
      },
      model: "whisper-large-v3",
      prompt: "Transcribe the following audio",
      response_format: "verbose_json",
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}