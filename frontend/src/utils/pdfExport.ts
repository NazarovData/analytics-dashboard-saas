import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportOptions {
  filename?: string
  quality?: number
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
}

/**
 * Экспорт элемента DOM в PDF
 * @param elementId ID элемента для экспорта
 * @param options Опции экспорта
 */
export async function exportToPDF(
  elementId: string, 
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
    quality = 0.95,
    format = 'a4',
    orientation = 'portrait'
  } = options

  try {
    // Находим элемент
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`)
    }

    // Показываем уведомление о начале экспорта
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        z-index: 10000;
        font-family: sans-serif;
      ">
        <div style="text-align: center;">
          <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
          <div>Создаем PDF отчет...</div>
        </div>
      </div>
    `
    document.body.appendChild(notification)

    // Создаем canvas из элемента
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#0f172a' // dark background
    })

    // Удаляем уведомление
    document.body.removeChild(notification)

    // Размеры страницы
    const imgWidth = format === 'a4' ? 210 : 216 // mm
    const pageHeight = format === 'a4' ? 297 : 279 // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    // Создаем PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })

    let position = 0

    // Добавляем изображение на первую страницу
    pdf.addImage(
      canvas.toDataURL('image/png', quality),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight
    )
    heightLeft -= pageHeight

    // Добавляем дополнительные страницы если нужно
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(
        canvas.toDataURL('image/png', quality),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      )
      heightLeft -= pageHeight
    }

    // Сохраняем PDF
    pdf.save(filename)

    // Показываем уведомление об успехе
    const successNotification = document.createElement('div')
    successNotification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        font-family: sans-serif;
        animation: slideIn 0.3s ease-out;
      ">
        ✅ PDF отчет успешно скачан!
      </div>
    `
    document.body.appendChild(successNotification)

    setTimeout(() => {
      document.body.removeChild(successNotification)
    }, 3000)

  } catch (error) {
    console.error('Error exporting to PDF:', error)
    
    // Показываем уведомление об ошибке
    const errorNotification = document.createElement('div')
    errorNotification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        font-family: sans-serif;
      ">
        ❌ Ошибка при создании PDF
      </div>
    `
    document.body.appendChild(errorNotification)

    setTimeout(() => {
      document.body.removeChild(errorNotification)
    }, 3000)

    throw error
  }
}

/**
 * Создает PDF отчет с кастомными данными (с поддержкой кириллицы)
 * @param data Данные аналитики
 * @param options Опции экспорта
 */
export async function createAnalyticsReport(
  data: any,
  options: ExportOptions & { whiteLabel?: any } = {}
): Promise<void> {
  const {
    filename = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
    whiteLabel = null
  } = options

  // Загружаем White Label настройки, если не переданы
  let branding = whiteLabel
  if (!branding) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/white-label/')
      if (response.ok) {
        const result = await response.json()
        branding = result.settings
      }
    } catch (e) {
      console.warn('Не удалось загрузить White Label настройки:', e)
    }
  }

  // Используем White Label или дефолтные значения
  const companyName = branding?.company_name || 'Analitix AI'
  const logoUrl = branding?.logo_url || null
  const primaryColor = branding?.primary_color || '#6366f1'
  const secondaryColor = branding?.secondary_color || '#8b5cf6'

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  // Создаем HTML для отчета
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Аналитический отчет</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 40px;
          color: #1a1a2e;
          background: white;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid ${primaryColor};
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 10px;
        }
        .logo-img {
          max-width: 120px;
          max-height: 60px;
          object-fit: contain;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #64748b;
          font-size: 14px;
        }
        h1 { 
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 20px 0 10px;
        }
        .date {
          color: #64748b;
          font-size: 14px;
        }
        .section {
          margin: 30px 0;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .metric-card {
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }
        .metric-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }
        .metric-value.highlight {
          color: ${primaryColor};
        }
        .insights-list {
          list-style: none;
        }
        .insight-item {
          padding: 20px;
          margin-bottom: 16px;
          border-radius: 12px;
          border-left: 4px solid;
        }
        .insight-item.success {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-color: #22c55e;
        }
        .insight-item.warning {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-color: #f59e0b;
        }
        .insight-item.alert {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-color: #ef4444;
        }
        .insight-item.info {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-color: #3b82f6;
        }
        .insight-title {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .insight-message {
          color: #475569;
          font-size: 14px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-container">
          ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo-img" />` : ''}
          <div class="logo">${logoUrl ? '' : '📊 '}${companyName}</div>
        </div>
        <div class="subtitle">Аналитическая платформа для бизнеса</div>
        <h1>Аналитический отчет</h1>
        <div class="date">Дата: ${new Date().toLocaleDateString('ru-RU', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric'
        })}</div>
      </div>
      
      <div class="section">
        <div class="section-title">📈 Основные показатели</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Общая выручка</div>
            <div class="metric-value highlight">${formatCurrency(data.analytics?.total_revenue || 0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Количество заказов</div>
            <div class="metric-value">${formatNumber(data.analytics?.total_orders || 0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Средний чек</div>
            <div class="metric-value">${formatCurrency(data.analytics?.average_check || data.analytics?.avg_check || 0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Уникальных клиентов</div>
            <div class="metric-value">${data.analytics?.unique_clients !== null && data.analytics?.unique_clients !== undefined 
              ? formatNumber(data.analytics?.unique_clients) 
              : '<span style="color:#F59E0B">⚠️ Нет данных</span>'}</div>
          </div>
        </div>
      </div>
      
      ${data.ai_trust_score ? `
        <div class="section">
          <div class="section-title">🎯 AI Trust Score</div>
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <div>
                <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Уровень доверия к анализу</div>
                <div style="font-size: 36px; font-weight: bold; color: ${data.ai_trust_score.overall_score >= 70 ? '#22c55e' : '#f59e0b'};">${data.ai_trust_score.overall_score}%</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; color: #64748b;">Данные: ${data.ai_trust_score.data_score}%</div>
                <div style="font-size: 12px; color: #64748b;">Расчёты: ${data.ai_trust_score.math_score}%</div>
                <div style="font-size: 12px; color: #64748b;">Инсайты: ${data.ai_trust_score.insights_score}%</div>
              </div>
            </div>
            <div style="background: rgba(255,255,255,0.7); border-radius: 8px; padding: 12px; font-size: 14px; color: #475569;">
              ${data.ai_trust_score.recommendation}
            </div>
          </div>
        </div>
      ` : ''}
      
      ${data.assumptions && data.assumptions.length > 0 ? `
        <div class="section">
          <div class="section-title">⚠️ Допущения отчёта</div>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px;">
            ${data.assumptions.map((a: any) => `
              <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; color: #9a3412; margin-bottom: 4px;">${a.assumption}</div>
                <div style="font-size: 13px; color: #78350f;">Влияние: ${a.impact}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${data.ai_insights?.insights && data.ai_insights.insights.length > 0 ? `
        <div class="section">
          <div class="section-title">🤖 AI Рекомендации</div>
          <ul class="insights-list">
            ${data.ai_insights.insights.slice(0, 5).map((insight: any, idx: number) => `
              <li class="insight-item ${insight.type || 'info'}">
                <div class="insight-title">
                  ${insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : insight.type === 'alert' ? '🚨' : '💡'}
                  ${idx + 1}. ${insight.title}
                </div>
                <div class="insight-message">${insight.message}</div>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div class="footer">
        Отчёт сгенерирован автоматически системой Analitix AI<br>
        ${new Date().toLocaleString('ru-RU')} • © ${new Date().getFullYear()} Analitix AI
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `

  // Открываем в новом окне и печатаем как PDF
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    // Fallback - скачиваем как HTML
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.replace('.pdf', '.html')
    link.click()
    URL.revokeObjectURL(url)
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Экспорт данных в CSV
 * @param data Данные для экспорта
 * @param filename Имя файла
 */
export function exportToCSV(data: any[], filename: string = 'export.csv'): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Получаем заголовки
  const headers = Object.keys(data[0])
  
  // Создаем CSV строку
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header]
      // Экранируем значения с запятыми
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value
    }).join(','))
  ].join('\n')

  // Создаем Blob и скачиваем
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Экспорт данных в Excel (XLSX) с форматированием
 * @param data Данные для экспорта
 * @param filename Имя файла
 * @param options Опции форматирования
 */
export async function exportToExcel(
  data: any[], 
  filename: string = 'export.xlsx',
  options: {
    sheetName?: string
    includeCharts?: boolean
    formatNumbers?: boolean
  } = {}
): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  try {
    // Пробуем динамический импорт библиотеки xlsx
    let XLSX: any
    try {
      XLSX = await import('xlsx')
    } catch (importError) {
      // Если библиотека не установлена - используем CSV
      console.warn('xlsx library not found, using CSV format')
      exportToCSV(data, filename.replace(/\.xlsx?$/i, '.csv'))
      return
    }

    // Создаём рабочую книгу
    const wb = XLSX.utils.book_new()
    
    // Подготовка данных
    const headers = Object.keys(data[0])
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Обработка дат
        if (value instanceof Date) {
          return value.toISOString().split('T')[0]
        }
        // Обработка null/undefined
        if (value === null || value === undefined) {
          return ''
        }
        return value
      })
    )
    
    // Создаём лист
    const ws_data = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    
    // Устанавливаем ширину колонок
    const colWidths = headers.map(header => ({
      wch: Math.max(header.length, 15)
    }))
    ws['!cols'] = colWidths
    
    // Добавляем лист в книгу
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Данные')
    
    // Сохраняем файл
    XLSX.writeFile(wb, filename)
    
    // Уведомление об успехе
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        font-family: sans-serif;
      ">
        ✅ Excel файл успешно скачан!
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => document.body.removeChild(notification), 3000)
    
  } catch (error: any) {
    // Fallback на CSV при любой ошибке
    console.error('Error exporting to Excel:', error)
    console.warn('Falling back to CSV format')
    exportToCSV(data, filename.replace(/\.xlsx?$/i, '.csv'))
  }
}





