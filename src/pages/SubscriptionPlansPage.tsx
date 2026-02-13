import React, { useState, useEffect } from 'react';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import CloudIcon from '@mui/icons-material/Cloud';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LandscapeIcon from '@mui/icons-material/Landscape';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../hooks/useAuth';
import { subscriptionService } from '../services/subscriptionService';
import type { UserSubscription, UsageTracking, PaymentHistory } from '../services/subscriptionService';
import './SubscriptionPlansPage.scss';

type TabType = 'subscription' | 'usage' | 'history';

const SubscriptionPlansPage: React.FC = () => {
  const { user } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('subscription');
  const [processing, setProcessing] = useState(false);

  // Hectare-based pricing - 5 GEL per hectare
  const [totalHectares, setTotalHectares] = useState(0);
  const PRICE_PER_HECTARE = 5;

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    } else if (user) {
      // User exists but no companyId - stop loading with 0 hectares
      setLoading(false);
    }
  }, [user?.companyId, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subscriptionData, usageData, historyData, fieldsData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getUsage(),
        subscriptionService.getPaymentHistory(),
        subscriptionService.getUserFields(user?.companyId)
      ]);

      setCurrentSubscription(subscriptionData);
      setUsage(usageData);
      setPaymentHistory(historyData);

      // Calculate total hectares from fields
      const hectares = fieldsData.reduce((total: number, field: any) => {
        const fieldArea = field.Area || field.area || field.FieldArea || field.fieldArea || 0;
        return total + (fieldArea || 0);
      }, 0);
      setTotalHectares(Math.round(hectares * 100) / 100);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    return Math.round(totalHectares * PRICE_PER_HECTARE * 100) / 100;
  };

  const handlePayment = async () => {
    if (processing || totalHectares <= 0) return;

    setProcessing(true);
    try {
      const response = await subscriptionService.subscribe({
        planId: 1, // Default plan for hectare-based
        billingPeriod: 'monthly',
        customAmount: calculateTotalAmount(),
        hectares: totalHectares
      });

      if (response.success && response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        alert(response.message || 'შეცდომა გადახდისას');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('შეცდომა გადახდისას');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('დარწმუნებული ხართ, რომ გსურთ გამოწერის გაუქმება?')) {
      return;
    }

    const success = await subscriptionService.cancelSubscription();
    if (success) {
      await loadData();
    } else {
      alert('შეცდომა გამოწერის გაუქმებისას');
    }
  };

  const handleToggleAutoRenew = async () => {
    const success = await subscriptionService.toggleAutoRenew();
    if (success) {
      await loadData();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ka-GE');
  };

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="loading-state">იტვირთება...</div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="page-header">
        <h1>გამოწერა</h1>
        <p>გადაიხადეთ თქვენი მიწის ფართობის მიხედვით</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          <CreditCardIcon />
          გამოწერა
        </button>
        <button
          className={`tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          <CloudIcon />
          მოხმარება
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <HistoryIcon />
          ისტორია
        </button>
      </div>

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="subscription-section">
          {/* Pricing Card */}
          <div className="pricing-card">
            <div className="pricing-header">
              <LandscapeIcon className="pricing-icon" />
              <h2>ჰექტარზე დაფუძნებული ფასი</h2>
              <p className="pricing-rate">
                <span className="rate">{PRICE_PER_HECTARE}</span>
                <span className="currency">₾</span>
                <span className="per">/ ჰა / თვე</span>
              </p>
            </div>

            <div className="hectare-summary">
              <div className="summary-row">
                <span className="label">
                  <AgricultureIcon />
                  თქვენი მიწის ფართობი:
                </span>
                <span className="value">{totalHectares} ჰა</span>
              </div>
              <div className="summary-row total">
                <span className="label">
                  <PaymentIcon />
                  თვიური გადასახადი:
                </span>
                <span className="value">{calculateTotalAmount()} ₾</span>
              </div>
            </div>

            {totalHectares > 0 ? (
              <button
                className="payment-btn"
                onClick={handlePayment}
                disabled={processing}
              >
                <CreditCardIcon />
                {processing ? 'მუშავდება...' : `გადახდა - ${calculateTotalAmount()} ₾`}
              </button>
            ) : (
              <div className="no-fields-message">
                <AgricultureIcon />
                <p>გთხოვთ დაამატოთ ველები გადახდის გასააქტიურებლად</p>
              </div>
            )}

            <div className="pricing-features">
              <h4>რას მოიცავს:</h4>
              <ul>
                <li>
                  <CheckCircleIcon className="check-icon" />
                  <span>ულიმიტო ამინდის მოთხოვნები</span>
                </li>
                <li>
                  <CheckCircleIcon className="check-icon" />
                  <span>ულიმიტო ველები</span>
                </li>
                <li>
                  <CheckCircleIcon className="check-icon" />
                  <span>მონაცემების ექსპორტი</span>
                </li>
                <li>
                  <CheckCircleIcon className="check-icon" />
                  <span>გაფართოებული ანალიტიკა</span>
                </li>
                <li>
                  <CheckCircleIcon className="check-icon" />
                  <span>პრიორიტეტული მხარდაჭერა</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Current Subscription Info */}
          {currentSubscription && currentSubscription.isActive && (
            <div className="current-subscription-info">
              <h3>მიმდინარე გამოწერა</h3>
              <div className="subscription-details">
                <div className="detail-item">
                  <span className="label">სტატუსი:</span>
                  <span className="value status-active">
                    <CheckCircleIcon />
                    აქტიური
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">დაწყების თარიღი:</span>
                  <span className="value">{formatDate(currentSubscription.startDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">დასრულების თარიღი:</span>
                  <span className="value">{formatDate(currentSubscription.endDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">ავტო-განახლება:</span>
                  <span className="value">
                    {currentSubscription.autoRenew ? 'ჩართული' : 'გამორთული'}
                    <button className="toggle-renew-btn" onClick={handleToggleAutoRenew}>
                      <AutorenewIcon fontSize="small" />
                    </button>
                  </span>
                </div>
              </div>
              <button className="cancel-subscription-btn" onClick={handleCancelSubscription}>
                გამოწერის გაუქმება
              </button>
            </div>
          )}
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div className="usage-section">
          <div className="usage-grid">
            <div className="usage-card">
              <div className="usage-icon">
                <CloudIcon />
              </div>
              <div className="usage-info">
                <h4>ამინდის მოთხოვნები</h4>
                <span className="usage-count">{usage?.weatherRequestsCount || 0} ამ თვეში</span>
              </div>
            </div>

            <div className="usage-card">
              <div className="usage-icon">
                <AgricultureIcon />
              </div>
              <div className="usage-info">
                <h4>ველები</h4>
                <span className="usage-count">{usage?.fieldsCount || 0} ველი</span>
              </div>
            </div>

            <div className="usage-card">
              <div className="usage-icon">
                <FileDownloadIcon />
              </div>
              <div className="usage-info">
                <h4>ექსპორტები</h4>
                <span className="usage-count">{usage?.exportsCount || 0} ამ თვეში</span>
              </div>
            </div>

            <div className="usage-card">
              <div className="usage-icon">
                <LandscapeIcon />
              </div>
              <div className="usage-info">
                <h4>მიწის ფართობი</h4>
                <span className="usage-count">{totalHectares} ჰა</span>
              </div>
            </div>
          </div>

          {usage?.resetDate && (
            <p className="reset-info">
              სტატისტიკა განულდება: <strong>{formatDate(usage.resetDate)}</strong>
            </p>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-section">
          {paymentHistory.length === 0 ? (
            <div className="empty-state">
              <PaymentIcon className="empty-icon" />
              <h3>გადახდის ისტორია ცარიელია</h3>
              <p>თქვენ ჯერ არ გაგიკეთებიათ გადახდა</p>
            </div>
          ) : (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>თარიღი</th>
                    <th>ფართობი</th>
                    <th>თანხა</th>
                    <th>სტატუსი</th>
                    <th>ტრანზაქციის ID</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(payment => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.paymentDate)}</td>
                      <td>{payment.subscriptionPlan?.nameKa || '-'}</td>
                      <td>{payment.amount} {payment.currency}</td>
                      <td>
                        <span className={`status-badge ${payment.status}`}>
                          {payment.status === 'completed' ? 'დასრულებული' :
                           payment.status === 'pending' ? 'მოლოდინში' :
                           payment.status === 'failed' ? 'წარუმატებელი' : payment.status}
                        </span>
                      </td>
                      <td className="transaction-id">{payment.transactionId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlansPage;
