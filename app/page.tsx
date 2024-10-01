import VoiceTranscription from '@/components/VoiceTranscription'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-900">
      <VoiceTranscription />
    </main>
  )
}