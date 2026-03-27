import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Clock, Download } from 'lucide-react';
import { RiskTrendChart, YieldHistoryChart } from './RiskTrendChart';
import { exportHistoryToExcel, type HistoricalAnalysis } from './ExportUtils';
import { fieldAnalysisService, type AnalysisHistoryItem } from '../../services/fieldAnalysisService';
import './HistoricalTrendView.scss';

interface HistoricalTrendViewProps {
  fieldId: string;
  fieldName: string;
  companyId: string;
  onSelectAnalysis?: (analysisId: string) => void;
}

const HistoricalTrendView: React.FC<HistoricalTrendViewProps> = ({
  fieldId,
  fieldName,
  companyId,
  onSelectAnalysis
}) => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'chart'>('chart');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadHistory();
  }, [fieldId, companyId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyData = await fieldAnalysisService.getAnalysisHistory(fieldId, companyId, 50);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByPeriod = (data: AnalysisHistoryItem[]) => {
    if (selectedPeriod === 'all') return data;

    const now = new Date();
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data.filter(item => new Date(item.date) >= cutoff);
  };

  const filteredHistory = filterByPeriod(history);

  const getRiskTrendData = () => {
    return filteredHistory.map(item => ({
      date: new Date(item.date).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' }),
      weather: item.weatherRisk || 0,
      water: item.waterRisk || 0,
      nutrient: item.nutrientRisk || 0,
      disease: item.diseaseRisk || 0,
      overall: item.riskScore
    })).reverse();
  };

  const getYieldTrendData = () => {
    return filteredHistory.map(item => ({
      date: new Date(item.date).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' }),
      predicted: item.predictedYield || 0,
      confidence: item.confidence || 0
    })).reverse();
  };

  const getTrendDirection = () => {
    if (filteredHistory.length < 2) return 'stable';
    const recent = filteredHistory[0].riskScore;
    const older = filteredHistory[filteredHistory.length - 1].riskScore;
    if (recent < older - 5) return 'improving';
    if (recent > older + 5) return 'worsening';
    return 'stable';
  };

  const getAverageRisk = () => {
    if (filteredHistory.length === 0) return 0;
    return Math.round(filteredHistory.reduce((sum, item) => sum + item.riskScore, 0) / filteredHistory.length);
  };

  const handleExport = () => {
    const exportData: HistoricalAnalysis[] = history.map(h => ({
      id: h.id,
      date: h.date,
      riskScore: h.riskScore,
      riskLevel: h.riskLevel,
      predictedYield: h.predictedYield,
      confidence: h.confidence,
      weatherRisk: h.weatherRisk,
      waterRisk: h.waterRisk,
      nutrientRisk: h.nutrientRisk,
      diseaseRisk: h.diseaseRisk,
      healthScore: h.healthScore,
      growthStage: h.growthStage
    }));
    exportHistoryToExcel(fieldName, exportData);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'მაღალი';
      case 'medium': return 'საშუალო';
      case 'low': return 'დაბალი';
      default: return 'უცნობი';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const trend = getTrendDirection();
  const avgRisk = getAverageRisk();

  if (loading) {
    return (
      <div className="historical-trend-view loading">
        <div className="loading-skeleton">
          <div className="skeleton-header" />
          <div className="skeleton-chart" />
          <div className="skeleton-items">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-item" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="historical-trend-view">
      {/* Header */}
      <div className="trend-header">
        <div className="header-title">
          <Calendar size={24} />
          <div>
            <h3>ისტორიული ტრენდები</h3>
            <span className="analysis-count">{history.length} ანალიზი</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="period-selector">
            {(['7d', '30d', '90d', 'all'] as const).map(period => (
              <button
                key={period}
                className={selectedPeriod === period ? 'active' : ''}
                onClick={() => setSelectedPeriod(period)}
              >
                {period === '7d' ? '7 დღე' :
                  period === '30d' ? '30 დღე' :
                    period === '90d' ? '90 დღე' : 'ყველა'}
              </button>
            ))}
          </div>

          <div className="view-toggle">
            <button
              className={viewMode === 'chart' ? 'active' : ''}
              onClick={() => setViewMode('chart')}
            >
              გრაფიკი
            </button>
            <button
              className={viewMode === 'timeline' ? 'active' : ''}
              onClick={() => setViewMode('timeline')}
            >
              თაიმლაინი
            </button>
          </div>

          <button className="export-btn" onClick={handleExport}>
            <Download size={18} />
            Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="trend-summary">
        <div className="summary-card">
          <div className="card-icon trend">
            {trend === 'improving' ? <TrendingDown size={24} className="improving" /> :
              trend === 'worsening' ? <TrendingUp size={24} className="worsening" /> :
                <Minus size={24} className="stable" />}
          </div>
          <div className="card-content">
            <span className="label">ტრენდი</span>
            <span className={`value ${trend}`}>
              {trend === 'improving' ? 'იზრდება' :
                trend === 'worsening' ? 'უარესდება' : 'სტაბილური'}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon average">
            <Clock size={24} />
          </div>
          <div className="card-content">
            <span className="label">საშუალო რისკი</span>
            <span className="value">{avgRisk}%</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon count">
            <Calendar size={24} />
          </div>
          <div className="card-content">
            <span className="label">პერიოდი</span>
            <span className="value">{filteredHistory.length} ჩანაწერი</span>
          </div>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="no-data">
          <p>არჩეულ პერიოდში მონაცემები არ მოიძებნა</p>
        </div>
      ) : viewMode === 'chart' ? (
        <div className="charts-container">
          <div className="chart-section">
            <h4>რისკების ტრენდი</h4>
            <RiskTrendChart data={getRiskTrendData()} height={280} />
          </div>

          <div className="chart-section">
            <h4>მოსავლის პროგნოზის ტრენდი</h4>
            <YieldHistoryChart data={getYieldTrendData()} height={280} />
          </div>
        </div>
      ) : (
        <div className="timeline-container">
          {filteredHistory.map((item, index) => (
            <div
              key={item.id}
              className="timeline-item"
              onClick={() => onSelectAnalysis?.(item.id)}
            >
              <div className="timeline-marker">
                <div
                  className="marker-dot"
                  style={{ backgroundColor: getRiskLevelColor(item.riskLevel) }}
                />
                {index < filteredHistory.length - 1 && (
                  <div className="marker-line" />
                )}
              </div>

              <div className="timeline-content">
                <div className="content-header">
                  <span className="date">{formatDate(item.date)}</span>
                  <span
                    className="risk-badge"
                    style={{ backgroundColor: getRiskLevelColor(item.riskLevel) }}
                  >
                    {getRiskLevelText(item.riskLevel)} - {item.riskScore}%
                  </span>
                </div>

                <div className="content-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">მოსავალი</span>
                      <span className="value">
                        {item.predictedYield
                          ? `${Math.round(item.predictedYield / 1000)}t`
                          : '-'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">სანდოობა</span>
                      <span className="value">
                        {item.confidence ? `${item.confidence}%` : '-'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">ჯანმრთელობა</span>
                      <span className="value">
                        {item.healthScore ? `${item.healthScore}%` : '-'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">ფაზა</span>
                      <span className="value">
                        {item.growthStage || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="risk-bars">
                    <div className="risk-bar">
                      <span className="risk-label">ამინდი</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill weather"
                          style={{ width: `${item.weatherRisk || 0}%` }}
                        />
                      </div>
                      <span className="risk-value">{item.weatherRisk || 0}%</span>
                    </div>
                    <div className="risk-bar">
                      <span className="risk-label">წყალი</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill water"
                          style={{ width: `${item.waterRisk || 0}%` }}
                        />
                      </div>
                      <span className="risk-value">{item.waterRisk || 0}%</span>
                    </div>
                    <div className="risk-bar">
                      <span className="risk-label">საკვები</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill nutrient"
                          style={{ width: `${item.nutrientRisk || 0}%` }}
                        />
                      </div>
                      <span className="risk-value">{item.nutrientRisk || 0}%</span>
                    </div>
                    <div className="risk-bar">
                      <span className="risk-label">დაავადება</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill disease"
                          style={{ width: `${item.diseaseRisk || 0}%` }}
                        />
                      </div>
                      <span className="risk-value">{item.diseaseRisk || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoricalTrendView;
