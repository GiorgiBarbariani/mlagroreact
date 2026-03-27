import React from 'react';
import './LoadingSkeleton.scss';

interface SkeletonProps {
  className?: string;
}

export const AnalysisSkeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`analysis-skeleton ${className}`}>
      {/* Header Skeleton */}
      <div className="skeleton-section">
        <div className="skeleton-header-row">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-badge" />
        </div>
        <div className="skeleton-meta">
          <div className="skeleton skeleton-text-sm" />
          <div className="skeleton skeleton-text-sm" />
          <div className="skeleton skeleton-text-sm" />
        </div>
      </div>

      {/* Risk Score Skeleton */}
      <div className="skeleton-risk-card">
        <div className="skeleton-gauge">
          <div className="skeleton skeleton-circle" />
          <div className="skeleton skeleton-text-md" />
        </div>
        <div className="skeleton-health">
          <div className="skeleton skeleton-icon" />
          <div className="skeleton skeleton-text-lg" />
        </div>
      </div>

      {/* Risk Grid Skeleton */}
      <div className="skeleton-section">
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-card-header">
                <div className="skeleton skeleton-icon" />
                <div className="skeleton skeleton-text-sm" />
              </div>
              <div className="skeleton skeleton-text-full" />
              <div className="skeleton skeleton-text-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Prediction Skeleton */}
      <div className="skeleton-section">
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton-prediction">
          <div className="skeleton skeleton-value-lg" />
          <div className="skeleton-meter">
            <div className="skeleton skeleton-bar" />
            <div className="skeleton skeleton-text-sm" />
          </div>
        </div>
      </div>

      {/* AI Insights Skeleton */}
      <div className="skeleton-section">
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton skeleton-text-full" />
        <div className="skeleton skeleton-text-full" />
        <div className="skeleton skeleton-text-half" />
      </div>
    </div>
  );
};

export const CompanySummarySkeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`company-summary-skeleton ${className}`}>
      <div className="skeleton skeleton-title-md" />
      <div className="skeleton-cards">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-summary-card">
            <div className="skeleton skeleton-icon-lg" />
            <div className="skeleton-card-content">
              <div className="skeleton skeleton-value" />
              <div className="skeleton skeleton-label" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<SkeletonProps & { rows?: number }> = ({ className = '', rows = 5 }) => {
  return (
    <div className={`table-skeleton ${className}`}>
      <div className="skeleton-table-header">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton skeleton-th" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          {[1, 2, 3, 4, 5, 6].map(j => (
            <div key={j} className="skeleton skeleton-td" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const FieldSelectorSkeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`field-selector-skeleton ${className}`}>
      <div className="skeleton skeleton-label" />
      <div className="skeleton-row">
        <div className="skeleton skeleton-select" />
        <div className="skeleton skeleton-button" />
      </div>
    </div>
  );
};
