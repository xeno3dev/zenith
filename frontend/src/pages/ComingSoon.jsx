import { Rocket } from 'lucide-react'

export default function ComingSoon({ label = 'This feature' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 px-4">
      <Rocket size={48} className="text-primary opacity-80" />
      <h1 className="text-2xl font-bold">Coming Soon</h1>
      <p className="text-text/60 max-w-sm">
        This will be added in a future ship&nbsp;🤫
        <br />
        Come back later and see generational greatness.
      </p>
    </div>
  )
}
