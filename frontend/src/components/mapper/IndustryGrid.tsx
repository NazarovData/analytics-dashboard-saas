import { Card, CardContent } from '@/components/ui/card'
import { getAllIndustries, type IndustryKey } from '@/lib/industries'
import { loadTemplate } from '@/lib/applyMapping'

interface IndustryGridProps {
  selected: IndustryKey | null
  onSelect: (key: IndustryKey) => void
}

export function IndustryGrid({ selected, onSelect }: IndustryGridProps) {
  const industries = getAllIndustries()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {industries.map((ind) => {
        const active = selected === ind.key
        const hasTemplate = !!loadTemplate(ind.key)

        return (
          <Card
            key={ind.key}
            onClick={() => onSelect(ind.key)}
            className={`
              cursor-pointer transition-all duration-200 border
              ${active
                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50 ring-2 ring-blue-500/30'
                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
              }
            `}
          >
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl mb-1.5 md:mb-2">{ind.icon}</div>
              <h3 className={`text-xs md:text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-gray-300'}`}>
                {ind.name}
              </h3>
              <p className="hidden md:block text-[10px] text-gray-500 mt-1">{ind.description}</p>
              {hasTemplate && (
                <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[9px] md:text-[10px] bg-green-500/20 text-green-400 rounded-full">
                  ✓ Шаблон
                </span>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
