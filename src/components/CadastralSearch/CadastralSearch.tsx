import React, { useState } from 'react';
import { Search, Download, MapPin, Loader } from 'lucide-react';
import { cadastralService, type CadastralParcel } from '../../services/cadastralService';
import './CadastralSearch.scss';

interface CadastralSearchProps {
  onParcelSelect?: (parcel: CadastralParcel) => void;
  onBulkExport?: (parcels: CadastralParcel[]) => void;
}

const CadastralSearch: React.FC<CadastralSearchProps> = ({ onParcelSelect, onBulkExport: _onBulkExport }) => {
  const [searchMode, setSearchMode] = useState<'single' | 'area' | 'batch'>('single');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchCodes, setBatchCodes] = useState('');
  const [results, setResults] = useState<CadastralParcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Area search parameters
  const [areaSearch, setAreaSearch] = useState({
    minLat: 41.0,
    maxLat: 42.0,
    minLng: 44.0,
    maxLng: 45.0
  });

  const handleSingleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const formattedCode = cadastralService.formatCadastralCode(searchQuery);

      if (!cadastralService.validateCadastralCode(formattedCode)) {
        setError('არასწორი საკადასტრო კოდის ფორმატი (XX.XX.XX.XXX)');
        setLoading(false);
        return;
      }

      const result = await cadastralService.searchByCadastralCode(formattedCode);

      if (result) {
        setResults([result]);
        if (onParcelSelect) {
          onParcelSelect(result);
        }
      } else {
        setResults([]);
        setError('საკადასტრო კოდი ვერ მოიძებნა');
      }
    } catch (err) {
      setError('ძებნის შეცდომა');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const parcels = await cadastralService.getParcelsByBoundingBox(
        areaSearch.minLng,
        areaSearch.minLat,
        areaSearch.maxLng,
        areaSearch.maxLat,
        100
      );

      setResults(parcels);
      if (parcels.length === 0) {
        setError('ამ ტერიტორიაზე ნაკვეთები ვერ მოიძებნა');
      }
    } catch (err) {
      setError('ძებნის შეცდომა');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSearch = async () => {
    if (!batchCodes.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const codes = batchCodes
        .split(/[\n,;]/)
        .map(code => code.trim())
        .filter(code => code.length > 0)
        .map(code => cadastralService.formatCadastralCode(code));

      const validCodes = codes.filter(code => cadastralService.validateCadastralCode(code));

      if (validCodes.length === 0) {
        setError('არასწორი საკადასტრო კოდების ფორმატი');
        setLoading(false);
        return;
      }

      const parcelsMap = await cadastralService.batchFetchCadastralData(validCodes);
      const parcels = Array.from(parcelsMap.values());

      setResults(parcels);
      if (parcels.length === 0) {
        setError('საკადასტრო კოდები ვერ მოიძებნა');
      }
    } catch (err) {
      setError('ძებნის შეცდომა');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportGeoJSON = () => {
    if (results.length === 0) return;

    const geoJson = cadastralService.exportToGeoJSON(results);
    const blob = new Blob([geoJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadastral_data_${new Date().toISOString()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const csv = cadastralService.exportToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadastral_data_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          setLoading(true);
          setError(null);

          try {
            const parcel = await cadastralService.getParcelAtLocation(latitude, longitude);

            if (parcel) {
              setResults([parcel]);
              if (onParcelSelect) {
                onParcelSelect(parcel);
              }
            } else {
              setResults([]);
              setError('ამ ლოკაციაზე საკადასტრო ნაკვეთი ვერ მოიძებნა');
            }
          } catch (err) {
            setError('ლოკაციის ძებნის შეცდომა');
            console.error(err);
          } finally {
            setLoading(false);
          }
        },
        (_error) => {
          setError('ლოკაციის მიღება ვერ მოხერხდა');
        }
      );
    } else {
      setError('ბრაუზერი არ მხარს უჭერს გეოლოკაციას');
    }
  };

  return (
    <div className="cadastral-search">
      <div className="search-header">
        <h3>საკადასტრო მონაცემების ძებნა</h3>

        <div className="search-mode-tabs">
          <button
            className={`tab ${searchMode === 'single' ? 'active' : ''}`}
            onClick={() => setSearchMode('single')}
          >
            ერთეული ძებნა
          </button>
          <button
            className={`tab ${searchMode === 'area' ? 'active' : ''}`}
            onClick={() => setSearchMode('area')}
          >
            ტერიტორიით ძებნა
          </button>
          <button
            className={`tab ${searchMode === 'batch' ? 'active' : ''}`}
            onClick={() => setSearchMode('batch')}
          >
            მასობრივი ძებნა
          </button>
        </div>
      </div>

      <div className="search-content">
        {searchMode === 'single' && (
          <div className="single-search">
            <div className="search-input-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()}
                placeholder="საკადასტრო კოდი (XX.XX.XX.XXX)"
                className="search-input"
              />
              <button
                className="search-btn"
                onClick={handleSingleSearch}
                disabled={loading}
              >
                {loading ? <Loader className="spinning" size={18} /> : <Search size={18} />}
              </button>
              <button
                className="location-btn"
                onClick={handleGetCurrentLocation}
                title="ჩემი ლოკაცია"
              >
                <MapPin size={18} />
              </button>
            </div>
          </div>
        )}

        {searchMode === 'area' && (
          <div className="area-search">
            <div className="coordinate-inputs">
              <div className="coord-group">
                <label>Min Latitude:</label>
                <input
                  type="number"
                  value={areaSearch.minLat}
                  onChange={(e) => setAreaSearch({ ...areaSearch, minLat: parseFloat(e.target.value) })}
                  step="0.001"
                />
              </div>
              <div className="coord-group">
                <label>Max Latitude:</label>
                <input
                  type="number"
                  value={areaSearch.maxLat}
                  onChange={(e) => setAreaSearch({ ...areaSearch, maxLat: parseFloat(e.target.value) })}
                  step="0.001"
                />
              </div>
              <div className="coord-group">
                <label>Min Longitude:</label>
                <input
                  type="number"
                  value={areaSearch.minLng}
                  onChange={(e) => setAreaSearch({ ...areaSearch, minLng: parseFloat(e.target.value) })}
                  step="0.001"
                />
              </div>
              <div className="coord-group">
                <label>Max Longitude:</label>
                <input
                  type="number"
                  value={areaSearch.maxLng}
                  onChange={(e) => setAreaSearch({ ...areaSearch, maxLng: parseFloat(e.target.value) })}
                  step="0.001"
                />
              </div>
            </div>
            <button
              className="search-btn-full"
              onClick={handleAreaSearch}
              disabled={loading}
            >
              {loading ? 'იტვირთება...' : 'ტერიტორიის ძებნა'}
            </button>
          </div>
        )}

        {searchMode === 'batch' && (
          <div className="batch-search">
            <textarea
              value={batchCodes}
              onChange={(e) => setBatchCodes(e.target.value)}
              placeholder="შეიყვანეთ საკადასტრო კოდები (თითო ხაზზე ან მძიმით გამოყოფილი)"
              className="batch-input"
              rows={5}
            />
            <button
              className="search-btn-full"
              onClick={handleBatchSearch}
              disabled={loading}
            >
              {loading ? 'იტვირთება...' : 'მასობრივი ძებნა'}
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h4>შედეგები ({results.length})</h4>
              <div className="export-buttons">
                <button className="export-btn" onClick={handleExportGeoJSON}>
                  <Download size={16} />
                  GeoJSON
                </button>
                <button className="export-btn" onClick={handleExportCSV}>
                  <Download size={16} />
                  CSV
                </button>
              </div>
            </div>

            <div className="results-list">
              {results.map((parcel, index) => (
                <div
                  key={index}
                  className="result-item"
                  onClick={() => onParcelSelect && onParcelSelect(parcel)}
                >
                  <div className="parcel-info">
                    <strong>კოდი: {parcel.cadastralCode}</strong>
                    <span>ფართობი: {(parcel.area / 10000).toFixed(4)} ჰა</span>
                    {parcel.municipality && <span>მუნიციპალიტეტი: {parcel.municipality}</span>}
                    {parcel.village && <span>სოფელი: {parcel.village}</span>}
                    {parcel.landUse && <span>დანიშნულება: {parcel.landUse}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadastralSearch;