import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq()

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const audio = formData.get('audio') as File

  if (!audio) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }

  try {
    const arrayBuffer = await audio.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const transcription = await groq.audio.transcriptions.create({
      file: buffer,
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