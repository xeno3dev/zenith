import AIChat from '../components/ai/AIChat'

export default function AIAssistant() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-text/60 mt-1">
          Ask about your assignments, grades, upcoming exams, or anything study-related.
          I can also create assignments and add flashcards for you.
        </p>
      </div>
      <AIChat />
    </div>
  )
}
