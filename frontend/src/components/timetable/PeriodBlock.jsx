export default function PeriodBlock({ subject, onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-16 md:h-20 rounded-lg flex flex-col items-center justify-center text-xs font-medium border border-white/5 transition-transform hover:scale-[1.02] w-full"
      style={{
        backgroundColor: subject ? `${subject.color}33` : 'rgba(255,255,255,0.03)',
        color: subject ? subject.color : 'rgba(226,232,240,0.4)',
      }}
    >
      {subject ? (
        <span className="px-1 text-center truncate w-full">{subject.name}</span>
      ) : (
        <span>+ Add</span>
      )}
    </button>
  )
}
