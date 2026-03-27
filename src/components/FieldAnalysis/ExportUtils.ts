import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { FieldAnalysisResult } from '../../services/fieldAnalysisService';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('ka-GE');
};

const getRiskLevelText = (level: string) => {
  switch (level) {
    case 'high': return 'მაღალი';
    case 'medium': return 'საშუალო';
    case 'low': return 'დაბალი';
    default: return 'უცნობი';
  }
};

export const exportToPDF = async (analysis: FieldAnalysisResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(76, 175, 80);
  doc.text('MLAgro - Field Analysis Report', pageWidth / 2, 20, { align: 'center' });

  // Field Info Header
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  doc.text(analysis.fieldName, 14, 35);

  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  const fieldInfo = [
    `Area: ${analysis.fieldInfo.area || '-'} ha`,
    `Crop: ${analysis.fieldInfo.cropType || '-'}`,
    `Soil: ${analysis.fieldInfo.soilType || '-'}`,
    `Analysis Date: ${formatDate(analysis.analysisDate)}`
  ].join(' | ');
  doc.text(fieldInfo, 14, 42);

  // Overall Risk Score
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text('Overall Risk Assessment', 14, 55);

  const riskColor = analysis.risks.overall.level === 'high' ? [244, 67, 54] :
    analysis.risks.overall.level === 'medium' ? [255, 152, 0] : [76, 175, 80];

  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.circle(30, 70, 12, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${analysis.risks.overall.score}`, 30, 73, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`${getRiskLevelText(analysis.risks.overall.level)} რისკი`, 50, 72);

  // Risk Details Table
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text('Risk Details', 14, 95);

  const riskTableData = [
    ['ამინდი', `${analysis.risks.weather.score}%`, getRiskLevelText(analysis.risks.weather.level)],
    ['წყალი', `${analysis.risks.water.score}%`, getRiskLevelText(analysis.risks.water.level)],
    ['საკვები ნივთიერებები', `${analysis.risks.nutrient.score}%`, getRiskLevelText(analysis.risks.nutrient.level)],
    ['დაავადება', `${analysis.risks.disease.score}%`, getRiskLevelText(analysis.risks.disease.level)]
  ];

  doc.autoTable({
    startY: 100,
    head: [['Risk Type', 'Score', 'Level']],
    body: riskTableData,
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' }
    }
  });

  // Harvest Prediction
  const currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text('Harvest Prediction', 14, currentY);

  const predictionData = [
    ['Estimated Yield', `${analysis.prediction.estimatedYield?.toLocaleString() || '-'} ${analysis.prediction.yieldUnit}`],
    ['Confidence', `${analysis.prediction.confidence}%`],
    ['Historical Average', analysis.prediction.comparisonToAverage
      ? `${analysis.prediction.comparisonToAverage.historicalAverage} kg/ha`
      : '-'],
    ['Difference from Average', analysis.prediction.comparisonToAverage
      ? `${analysis.prediction.comparisonToAverage.difference >= 0 ? '+' : ''}${analysis.prediction.comparisonToAverage.difference} kg/ha`
      : '-']
  ];

  doc.autoTable({
    startY: currentY + 5,
    head: [['Metric', 'Value']],
    body: predictionData,
    theme: 'striped',
    headStyles: { fillColor: [255, 152, 0], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // AI Insights (if available)
  if (analysis.aiInsights && !analysis.aiInsights.error) {
    const insightY = (doc as any).lastAutoTable.finalY + 15;

    if (insightY > 250) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('AI Insights & Recommendations', 14, 20);
    } else {
      doc.setFontSize(14);
      doc.text('AI Insights & Recommendations', 14, insightY);
    }

    const startY = insightY > 250 ? 25 : insightY + 5;

    if (analysis.aiInsights.summary) {
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      const splitSummary = doc.splitTextToSize(analysis.aiInsights.summary, pageWidth - 28);
      doc.text(splitSummary, 14, startY + 5);
    }

    // Recommendations
    if (analysis.aiInsights.recommendations) {
      const recY = startY + 25;
      const recommendations: string[][] = [];

      if (analysis.aiInsights.recommendations.immediate?.length) {
        recommendations.push(['Immediate', analysis.aiInsights.recommendations.immediate.join('; ')]);
      }
      if (analysis.aiInsights.recommendations.shortTerm?.length) {
        recommendations.push(['Short-term', analysis.aiInsights.recommendations.shortTerm.join('; ')]);
      }
      if (analysis.aiInsights.recommendations.longTerm?.length) {
        recommendations.push(['Long-term', analysis.aiInsights.recommendations.longTerm.join('; ')]);
      }

      if (recommendations.length > 0) {
        doc.autoTable({
          startY: recY,
          head: [['Priority', 'Recommendations']],
          body: recommendations,
          theme: 'grid',
          headStyles: { fillColor: [156, 39, 176], textColor: 255 },
          styles: { fontSize: 9, cellPadding: 5 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: pageWidth - 58 }
          }
        });
      }
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated by MLAgro | ${formatDate(new Date().toISOString())} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`MLAgro_Analysis_${analysis.fieldName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (analysis: FieldAnalysisResult) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewData = [
    ['MLAgro - Field Analysis Report'],
    [''],
    ['Field Information'],
    ['Field Name', analysis.fieldName],
    ['Area (ha)', analysis.fieldInfo.area || '-'],
    ['Crop Type', analysis.fieldInfo.cropType || '-'],
    ['Soil Type', analysis.fieldInfo.soilType || '-'],
    ['Irrigation Type', analysis.fieldInfo.irrigationType || '-'],
    ['Planting Date', formatDate(analysis.fieldInfo.plantingDate)],
    ['Analysis Date', formatDate(analysis.analysisDate)],
    [''],
    ['Overall Risk Assessment'],
    ['Risk Score', analysis.risks.overall.score],
    ['Risk Level', getRiskLevelText(analysis.risks.overall.level)],
    ['Health Score', analysis.aiInsights?.healthScore || '-'],
    ['Growth Stage', analysis.aiInsights?.growthStage || '-']
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  overviewSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Sheet 2: Risk Details
  const riskData = [
    ['Risk Type', 'Score (%)', 'Level', 'Factors'],
    [
      'Weather (ამინდი)',
      analysis.risks.weather.score,
      getRiskLevelText(analysis.risks.weather.level),
      analysis.risks.weather.factors.join('; ')
    ],
    [
      'Water (წყალი)',
      analysis.risks.water.score,
      getRiskLevelText(analysis.risks.water.level),
      analysis.risks.water.factors.join('; ')
    ],
    [
      'Nutrient (საკვები)',
      analysis.risks.nutrient.score,
      getRiskLevelText(analysis.risks.nutrient.level),
      analysis.risks.nutrient.factors.join('; ')
    ],
    [
      'Disease (დაავადება)',
      analysis.risks.disease.score,
      getRiskLevelText(analysis.risks.disease.level),
      analysis.risks.disease.factors.join('; ')
    ]
  ];

  const riskSheet = XLSX.utils.aoa_to_sheet(riskData);
  riskSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, riskSheet, 'Risk Details');

  // Sheet 3: Harvest Prediction
  const predictionData = [
    ['Harvest Prediction'],
    [''],
    ['Metric', 'Value'],
    ['Estimated Yield', `${analysis.prediction.estimatedYield?.toLocaleString() || '-'} ${analysis.prediction.yieldUnit}`],
    ['Confidence', `${analysis.prediction.confidence}%`],
    ['Historical Average', analysis.prediction.comparisonToAverage
      ? `${analysis.prediction.comparisonToAverage.historicalAverage} kg/ha`
      : '-'],
    ['Difference', analysis.prediction.comparisonToAverage
      ? `${analysis.prediction.comparisonToAverage.difference >= 0 ? '+' : ''}${analysis.prediction.comparisonToAverage.difference} kg/ha`
      : '-'],
    [''],
    ['Prediction Factors'],
    ...analysis.prediction.factors.map(f => [f])
  ];

  const predictionSheet = XLSX.utils.aoa_to_sheet(predictionData);
  predictionSheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, predictionSheet, 'Prediction');

  // Sheet 4: AI Insights & Recommendations
  if (analysis.aiInsights && !analysis.aiInsights.error) {
    const insightData: (string | number)[][] = [
      ['AI Insights & Recommendations'],
      [''],
      ['Summary'],
      [analysis.aiInsights.summary || '-'],
      [''],
      ['Harvest Analysis'],
      ['Prediction', analysis.aiInsights.harvestAnalysis?.prediction || '-'],
      ['Optimal Harvest Time', analysis.aiInsights.harvestAnalysis?.optimalHarvestTime || '-'],
      [''],
      ['Yield Optimization Tips'],
      ...(analysis.aiInsights.harvestAnalysis?.yieldOptimization?.map(tip => [tip]) || [['No tips available']]),
      [''],
      ['Risk Analysis'],
      ['Primary Risks'],
      ...(analysis.aiInsights.riskAnalysis?.primaryRisks?.map(risk => [risk]) || [['No risks identified']]),
      [''],
      ['Mitigation Strategies'],
      ...(analysis.aiInsights.riskAnalysis?.mitigationStrategies?.map(strategy => [strategy]) || [['No strategies available']]),
      [''],
      ['Recommendations'],
      ['Priority', 'Action'],
      ...((analysis.aiInsights.recommendations?.immediate || []).map(rec => ['Immediate', rec])),
      ...((analysis.aiInsights.recommendations?.shortTerm || []).map(rec => ['Short-term', rec])),
      ...((analysis.aiInsights.recommendations?.longTerm || []).map(rec => ['Long-term', rec]))
    ];

    const insightSheet = XLSX.utils.aoa_to_sheet(insightData);
    insightSheet['!cols'] = [{ wch: 20 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, insightSheet, 'AI Insights');
  }

  // Generate and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `MLAgro_Analysis_${analysis.fieldName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export interface HistoricalAnalysis {
  id: string;
  date: string;
  riskScore: number;
  riskLevel: string;
  predictedYield: number | null;
  confidence: number | null;
  weatherRisk: number | null;
  waterRisk: number | null;
  nutrientRisk: number | null;
  diseaseRisk: number | null;
  healthScore: number | null;
  growthStage: string | null;
}

export const exportHistoryToExcel = (
  fieldName: string,
  history: HistoricalAnalysis[]
) => {
  const workbook = XLSX.utils.book_new();

  // Historical Data Sheet
  const historyData = [
    ['MLAgro - Historical Analysis Data'],
    ['Field:', fieldName],
    ['Export Date:', formatDate(new Date().toISOString())],
    [''],
    [
      'Date',
      'Overall Risk',
      'Risk Level',
      'Weather Risk',
      'Water Risk',
      'Nutrient Risk',
      'Disease Risk',
      'Predicted Yield',
      'Confidence',
      'Health Score',
      'Growth Stage'
    ],
    ...history.map(h => [
      formatDate(h.date),
      h.riskScore,
      getRiskLevelText(h.riskLevel),
      h.weatherRisk || '-',
      h.waterRisk || '-',
      h.nutrientRisk || '-',
      h.diseaseRisk || '-',
      h.predictedYield ? `${h.predictedYield.toLocaleString()} kg` : '-',
      h.confidence ? `${h.confidence}%` : '-',
      h.healthScore || '-',
      h.growthStage || '-'
    ])
  ];

  const historySheet = XLSX.utils.aoa_to_sheet(historyData);
  historySheet['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(workbook, historySheet, 'History');

  // Generate and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `MLAgro_History_${fieldName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
