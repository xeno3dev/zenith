import { Layers } from 'lucide-react'

export default function FlashcardDeck({ deck, dueCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-surface rounded-xl p-5 text-left hover:bg-white/5 transition-colors relative"
    >
      {dueCount > 0 && (
        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-accent text-white font-semibold">
          {dueCount} due
        </span>
      )}
      <Layers className="text-primary mb-3" size={24} />
      <h3 className="font-semibold">{deck.name}</h3>
      {deck.description && (
        <p className="text-sm text-text/60 mt-1 line-clamp-2">{deck.description}</p>
      )}
      <p className="text-xs text-text/40 mt-3">{deck.card_count ?? 0} cards</p>
    </button>
  )
}
