import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface ExportData {
  title: string
  headers: string[]
  rows: (string | number)[][]
  summary?: Record<string, string | number>
}

interface ExportButtonProps {
  data: ExportData
  filename?: string
}

export function ExportButton({ data, filename = 'report' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null)

  // Export to Excel (CSV format - works without external libraries)
  const exportToExcel = async () => {
    setIsExporting('excel')
    try {
      // Create CSV content
      let csvContent = '\uFEFF' // BOM for UTF-8
      
      // Title
      csvContent += `${data.title}\n\n`
      
      // Headers
      csvContent += data.headers.join(';') + '\n'
      
      // Rows
      data.rows.forEach(row => {
        csvContent += row.join(';') + '\n'
      })
      
      // Summary
      if (data.summary) {
        csvContent += '\n'
        Object.entries(data.summary).forEach(([key, value]) => {
          csvContent += `${key};${value}\n`
        })
      }
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      
      toast.success('Excel файл скачан!')
      setIsOpen(false)
    } catch (error) {
      toast.error('Ошибка экспорта в Excel')
      console.error(error)
    } finally {
      setIsExporting(null)
    }
  }

  // Export to PDF (using browser print)
  const exportToPDF = async () => {
    setIsExporting('pdf')
    try {
      // Create printable HTML
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Разрешите всплывающие окна для экспорта PDF')
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${data.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 40px;
              color: #1a1a2e;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #6366f1;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #6366f1;
              margin-bottom: 5px;
            }
            h1 { 
              font-size: 22px;
              color: #1a1a2e;
              margin-top: 10px;
            }
            .date {
              color: #666;
              font-size: 12px;
              margin-top: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 12px;
            }
            th { 
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
            }
            td { 
              padding: 10px 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) { background: #f9fafb; }
            tr:hover { background: #f3f4f6; }
            .summary {
              margin-top: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border-radius: 8px;
              border-left: 4px solid #6366f1;
            }
            .summary h3 {
              color: #6366f1;
              margin-bottom: 15px;
              font-size: 14px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px dashed #cbd5e1;
            }
            .summary-label { color: #64748b; }
            .summary-value { font-weight: 600; color: #1a1a2e; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #9ca3af;
              font-size: 10px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">📊 Analitix AI</div>
            <h1>${data.title}</h1>
            <div class="date">Сформировано: ${new Date().toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                ${data.headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${data.summary ? `
            <div class="summary">
              <h3>📈 Итоги</h3>
              <div class="summary-grid">
                ${Object.entries(data.summary).map(([key, value]) => `
                  <div class="summary-item">
                    <span class="summary-label">${key}</span>
                    <span class="summary-value">${value}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="footer">
            Отчёт сгенерирован автоматически системой Analitix AI<br>
            © ${new Date().getFullYear()} Analitix AI. Все права защищены.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
        </html>
      `

      printWindow.document.write(html)
      printWindow.document.close()
      
      toast.success('PDF готов к сохранению!')
      setIsOpen(false)
    } catch (error) {
      toast.error('Ошибка экспорта в PDF')
      console.error(error)
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2"
      >
        <Download className="h-4 w-4" />
        Экспорт
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2">
              <p className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                Выберите формат
              </p>
              
              {/* Excel */}
              <button
                onClick={exportToExcel}
                disabled={isExporting !== null}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors">
                  {isExporting === 'excel' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-5 w-5" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Excel (CSV)</p>
                  <p className="text-xs text-gray-500">Таблица для Excel</p>
                </div>
              </button>

              {/* PDF */}
              <button
                onClick={exportToPDF}
                disabled={isExporting !== null}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                  {isExporting === 'pdf' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">PDF</p>
                  <p className="text-xs text-gray-500">Красивый отчёт</p>
                </div>
              </button>
            </div>
            
            {/* Footer hint */}
            <div className="px-4 py-3 bg-white/5 border-t border-white/10">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Check className="h-3 w-3 text-green-400" />
                Данные актуальны на текущий момент
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Helper component for quick export with predefined data
export function QuickExportButton({ 
  title,
  getData 
}: { 
  title: string
  getData: () => ExportData 
}) {
  const [data, setData] = useState<ExportData | null>(null)

  const handleClick = () => {
    const exportData = getData()
    setData(exportData)
  }

  if (!data) {
    return (
      <Button
        onClick={handleClick}
        variant="outline"
        className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2"
      >
        <Download className="h-4 w-4" />
        Экспорт
      </Button>
    )
  }

  return <ExportButton data={data} filename={title.toLowerCase().replace(/\s+/g, '_')} />
}















