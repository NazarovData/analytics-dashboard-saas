import { Check } from 'lucide-react'

interface Step {
  label: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  current: number
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="mb-6 md:mb-8">
      {/* Mobile: compact progress bar */}
      <div className="flex md:hidden items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${((current) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
          {current + 1} / {steps.length} — <span className="text-white font-medium">{steps[current]?.label}</span>
        </span>
      </div>

      {/* Desktop: full step indicator */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, idx) => {
          const done = idx < current
          const active = idx === current
          return (
            <div key={idx} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? 'bg-green-500 text-white' : ''}
                  ${active ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ring-4 ring-blue-500/30' : ''}
                  ${!done && !active ? 'bg-white/10 text-gray-500 border border-white/20' : ''}
                `}>
                  {done ? <Check className="h-5 w-5" /> : idx + 1}
                </div>
                <span className={`mt-2 text-xs text-center max-w-[80px] ${active ? 'text-white font-semibold' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mt-[-18px] ${done ? 'bg-green-500' : 'bg-white/10'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
