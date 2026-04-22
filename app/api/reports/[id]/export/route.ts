import { db } from '@/db'
import { monthlyReports } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // 2. Fetch the report with ownership check
    const [report] = await db
      .select()
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.id, id),
          eq(monthlyReports.userId, user.userId),
        ),
      )
      .limit(1)

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    // 3. Generate PDF
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    let page = pdfDoc.addPage([595.28, 841.89]) // A4 size
    const { width, height } = page.getSize()
    let yPosition = height - 50

    const data = report.reportData as any

    // Helper function to add text
    const addText = (
      text: string,
      x: number,
      size: number = 12,
      font = timesRomanFont,
      color = rgb(0, 0, 0),
    ) => {
      if (yPosition < 50) {
        // Add new page if we're running out of space
        page = pdfDoc.addPage([595.28, 841.89])
        yPosition = height - 50
      }
      page.drawText(text, {
        x,
        y: yPosition,
        size,
        font,
        color,
      })
      yPosition -= size + 6
    }

    const formatCurrency = (amount: string | number) => {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const formatMonth = (month: string) => {
      const [year, m] = month.split('-')
      const date = new Date(parseInt(year), parseInt(m) - 1)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }

    // Title
    addText('Financial Report', 50, 24, timesRomanBold, rgb(0.1, 0.1, 0.1))
    addText(formatMonth(report.month), 50, 16, timesRomanFont, rgb(0.4, 0.4, 0.4))
    addText(
      `Generated: ${new Date(report.generatedAt).toLocaleDateString('en-US')}`,
      50,
      10,
      timesRomanFont,
      rgb(0.5, 0.5, 0.5),
    )
    yPosition -= 10

    // Summary Section
    addText('Summary', 50, 18, timesRomanBold)
    yPosition -= 5
    addText(`Total Income: ${formatCurrency(data.summary.totalIncome)}`, 70, 12)
    addText(`Total Expenses: ${formatCurrency(data.summary.totalExpenses)}`, 70, 12)
    addText(`Net Income: ${formatCurrency(data.summary.netIncome)}`, 70, 12)
    addText(`Total Savings: ${formatCurrency(data.summary.totalSavings)}`, 70, 12)
    addText(`Current Balance: ${formatCurrency(data.summary.currentBalance)}`, 70, 12)
    addText(`Savings Rate: ${data.summary.savingsRate}%`, 70, 12)
    yPosition -= 10

    // Income by Category
    if (data.incomeByCategory && data.incomeByCategory.length > 0) {
      addText('Income by Category', 50, 18, timesRomanBold)
      yPosition -= 5
      data.incomeByCategory.forEach((cat: any) => {
        addText(
          `  ${cat.categoryIcon} ${cat.categoryName}: ${formatCurrency(cat.amount)} (${cat.count} transaction${cat.count === 1 ? '' : 's'})`,
          70,
          11,
        )
      })
      yPosition -= 10
    }

    // Expenses by Category
    if (data.expensesByCategory && data.expensesByCategory.length > 0) {
      addText('Expenses by Category', 50, 18, timesRomanBold)
      yPosition -= 5
      data.expensesByCategory.forEach((cat: any) => {
        addText(
          `  ${cat.categoryIcon} ${cat.categoryName}: ${formatCurrency(cat.amount)} (${cat.count} transaction${cat.count === 1 ? '' : 's'})`,
          70,
          11,
        )
      })
      yPosition -= 10
    }

    // Budget Comparison
    if (data.budgetComparison && data.budgetComparison.length > 0) {
      addText('Budget vs Actual', 50, 18, timesRomanBold)
      yPosition -= 5
      data.budgetComparison.forEach((budget: any) => {
        addText(
          `  ${budget.categoryIcon} ${budget.categoryName}:`,
          70,
          11,
          timesRomanBold,
        )
        addText(
          `    Budget: ${formatCurrency(budget.budgetLimit)} | Actual: ${formatCurrency(budget.actualAmount)} | ${budget.percentageUsed}% used`,
          70,
          10,
        )
      })
      yPosition -= 10
    }

    // Savings by Goal
    if (data.savingsByGoal && data.savingsByGoal.length > 0) {
      addText('Savings Contributions', 50, 18, timesRomanBold)
      yPosition -= 5
      data.savingsByGoal.forEach((goal: any) => {
        addText(
          `  ${goal.goalName}: ${formatCurrency(goal.amount)} (${goal.count} contribution${goal.count === 1 ? '' : 's'})`,
          70,
          11,
        )
        addText(
          `    Target: ${formatCurrency(goal.goalTarget)}`,
          70,
          10,
          timesRomanFont,
          rgb(0.4, 0.4, 0.4),
        )
      })
      yPosition -= 10
    }

    // Statistics
    addText('Statistics', 50, 18, timesRomanBold)
    yPosition -= 5
    addText(`Total Transactions: ${data.transactionCount}`, 70, 11)
    addText(`Active Budgets: ${data.budgetCount}`, 70, 11)
    addText(`Savings Contributions: ${data.savingsEntryCount}`, 70, 11)

    // 4. Serialize PDF and return
    const pdfBytes = await pdfDoc.save()

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="financial-report-${report.month}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/reports/:id/export]', error)
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
