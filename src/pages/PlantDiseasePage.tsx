import React, { useState, useRef } from 'react';
import {
  Upload, Camera, Leaf, AlertTriangle, CheckCircle,
  Loader2, Info, ThermometerSun, Shield, Lightbulb,
  XCircle, ImageIcon, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { plantDiseaseService, type PlantDiseaseAnalysis } from '../services/plantDiseaseService';
import './PlantDiseasePage.scss';

const PlantDiseasePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PlantDiseaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('გთხოვთ აირჩიოთ სურათის ფაილი');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('ფაილის ზომა არ უნდა აღემატებოდეს 10MB-ს');
        return;
      }
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await plantDiseaseService.analyzeImage(selectedFile);
      setAnalysis(response.analysis);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.message || 'ანალიზის შესრულება ვერ მოხერხდა');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getHealthStatusInfo = (status: string) => {
    switch (status) {
      case 'healthy':
        return { color: '#4CAF50', text: 'ჯანმრთელი', icon: CheckCircle };
      case 'diseased':
        return { color: '#F44336', text: 'დაავადებული', icon: AlertTriangle };
      case 'stressed':
        return { color: '#FF9800', text: 'სტრესული', icon: ThermometerSun };
      default:
        return { color: '#9E9E9E', text: 'უცნობი', icon: Info };
    }
  };

  const getSeverityInfo = (severity: string | null | undefined) => {
    switch (severity) {
      case 'mild':
        return { color: '#FFC107', text: 'მსუბუქი' };
      case 'moderate':
        return { color: '#FF9800', text: 'საშუალო' };
      case 'severe':
        return { color: '#F44336', text: 'მძიმე' };
      case 'critical':
        return { color: '#B71C1C', text: 'კრიტიკული' };
      default:
        return null;
    }
  };

  return (
    <div className="plant-disease-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>უკან</span>
        </button>
        <div className="header-content">
          <Leaf size={28} className="header-icon" />
          <div>
            <h1>მცენარის დაავადების ანალიზი</h1>
            <p>ატვირთეთ მცენარის სურათი დაავადების დიაგნოსტიკისთვის</p>
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        <div className="upload-section">
          <div
            className={`upload-area ${selectedImage ? 'has-image' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="preview-container">
                <img src={selectedImage} alt="Selected plant" className="preview-image" />
                <button className="btn-remove" onClick={(e) => { e.stopPropagation(); resetAnalysis(); }}>
                  <XCircle size={24} />
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icons">
                  <Upload size={48} />
                  <Camera size={32} />
                </div>
                <h3>ატვირთეთ სურათი</h3>
                <p>გადაიტანეთ სურათი აქ ან დააწკაპუნეთ ასარჩევად</p>
                <span className="file-info">მხარდაჭერილი ფორმატები: JPG, PNG, WebP (მაქს. 10MB)</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
            />
          </div>

          {selectedImage && !analysis && (
            <button
              className="btn-analyze"
              onClick={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  <span>მიმდინარეობს ანალიზი...</span>
                </>
              ) : (
                <>
                  <Leaf size={20} />
                  <span>დაავადების ანალიზი</span>
                </>
              )}
            </button>
          )}

          {error && (
            <div className="error-message">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {analysis && (
          <div className="results-section">
            <h2>ანალიზის შედეგები</h2>

            {!analysis.isPlant ? (
              <div className="not-plant-warning">
                <ImageIcon size={48} />
                <h3>მცენარე ვერ გამოვლინდა</h3>
                <p>{analysis.additionalNotes || 'გთხოვთ ატვირთოთ მცენარის სურათი'}</p>
              </div>
            ) : (
              <>
                {/* Health Status Card */}
                <div className="result-card health-status">
                  <div className="status-header">
                    {(() => {
                      const statusInfo = getHealthStatusInfo(analysis.healthStatus);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <>
                          <StatusIcon size={32} style={{ color: statusInfo.color }} />
                          <div>
                            <h3 style={{ color: statusInfo.color }}>{statusInfo.text}</h3>
                            {analysis.plantIdentified && (
                              <span className="plant-name">{analysis.plantIdentified}</span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                    <div className="confidence-badge">
                      <span className="confidence-value">{analysis.confidence}%</span>
                      <span className="confidence-label">სიზუსტე</span>
                    </div>
                  </div>
                </div>

                {/* Disease Info */}
                {analysis.diseaseDetected && analysis.diseaseName && (
                  <div className="result-card disease-info">
                    <div className="card-header">
                      <AlertTriangle size={20} />
                      <h3>გამოვლენილი დაავადება</h3>
                    </div>
                    <div className="disease-details">
                      <div className="disease-name">
                        <strong>{analysis.diseaseName}</strong>
                        {analysis.diseaseNameKa && (
                          <span className="name-ka">({analysis.diseaseNameKa})</span>
                        )}
                      </div>
                      {analysis.severity && (
                        <div
                          className="severity-badge"
                          style={{ backgroundColor: getSeverityInfo(analysis.severity)?.color }}
                        >
                          {getSeverityInfo(analysis.severity)?.text}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Symptoms */}
                {analysis.symptoms && analysis.symptoms.length > 0 && (
                  <div className="result-card">
                    <div className="card-header">
                      <Info size={20} />
                      <h3>სიმპტომები</h3>
                    </div>
                    <ul className="info-list">
                      {analysis.symptoms.map((symptom, index) => (
                        <li key={index}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Possible Causes */}
                {analysis.possibleCauses && analysis.possibleCauses.length > 0 && (
                  <div className="result-card">
                    <div className="card-header">
                      <AlertTriangle size={20} />
                      <h3>შესაძლო მიზეზები</h3>
                    </div>
                    <ul className="info-list">
                      {analysis.possibleCauses.map((cause, index) => (
                        <li key={index}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="result-card recommendations">
                    <div className="card-header">
                      <Shield size={20} />
                      <h3>რეკომენდაციები</h3>
                    </div>
                    <ul className="info-list">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prevention Tips */}
                {analysis.preventionTips && analysis.preventionTips.length > 0 && (
                  <div className="result-card prevention">
                    <div className="card-header">
                      <Lightbulb size={20} />
                      <h3>პრევენციის რჩევები</h3>
                    </div>
                    <ul className="info-list">
                      {analysis.preventionTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Notes */}
                {analysis.additionalNotes && (
                  <div className="result-card notes">
                    <div className="card-header">
                      <Info size={20} />
                      <h3>დამატებითი შენიშვნები</h3>
                    </div>
                    <p>{analysis.additionalNotes}</p>
                  </div>
                )}
              </>
            )}

            <button className="btn-new-analysis" onClick={resetAnalysis}>
              <Camera size={20} />
              <span>ახალი ანალიზი</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantDiseasePage;
