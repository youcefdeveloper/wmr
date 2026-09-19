import { client } from '@config/client';
import { useState, useRef } from 'react'

type ImportRateModalProps = {
  title: string
  date: string
  onClose?: () => void
  onReload?: () => void
}

const sourceUrlDefault = import.meta.env.PUBLIC_IMPORT_RATES_SOURCE_URL || 'https://www.freddiemac.com/pmms/docs/historicalweeklydata.xlsx';

function ImportRateModal({ title, date, onClose, onReload }: ImportRateModalProps) {
  const [importType, setImportType] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importUrl, setImportUrl] = useState(sourceUrlDefault);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notify, setNotify] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(sourceUrlDefault);
  };
  const handleFileButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };
  const handleImport = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (!client) throw new Error('Axios client not available');
      if (importType === 'url') {
        res = await client.post(`/api/v1/import-excel?url=${encodeURIComponent(importUrl)}&push=${notify ? 'yes' : 'no'}`, {}, {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true,
        });
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await client.post(`/api/v1/import-excel?push=${notify ? 'yes' : 'no'}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          validateStatus: () => true,
        });
      } else {
        throw new Error('No file selected');
      }
      const data = res.data;
      if (res.status < 200 || res.status >= 300) throw new Error(data?.error || 'Import failed');
      setSelectedFile(null);
      setError('');
      if (onClose) onClose();
      if (onReload) onReload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="importRates" tabIndex={-1} aria-labelledby="importRatesLabel" aria-hidden="true">
      <div className="modal-dialog modal-fullscreen-sm-down--  modal-sheet-sm">
        <div className="modal-content h-100">
          <div className="modal-header d-flex justify-content-between align-items-center">
            <h1 className="modal-title fs-5 fw-bold mb-0" id="importRatesLabel">{title}</h1>
            <a href="#" className="bi bi-x-lg h4 mb-0" data-bs-dismiss="modal" aria-label="Close"></a>
          </div>
          <div className="modal-body mb-5">
            <div className="d-flex justify-content-start align-items-center gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  id="provider-google"
                  name="importType"
                  type="radio"
                  checked={importType === 'url'}
                  onChange={() => setImportType('url')}
                  disabled={loading}
                />
                <label className="form-check-label ps-1 me-3" htmlFor="provider-google">URL</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input custom-file-input"
                  id="provider-manual"
                  name="importType"
                  type="radio"
                  checked={importType === 'file'}
                  onChange={() => setImportType('file')}
                  disabled={loading}
                />
                <label className="form-check-label ps-1 me-3 custom-file-label" htmlFor="provider-manual">Upload File</label>
              </div>
            </div>
            {importType === 'url' && (
              <div>
                <input 
                  type="url" 
                  className="form-control form-control-lg mt-3" 
                  id="importUrl" 
                  placeholder="https://example.com/rates.xlsx" 
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  disabled={loading}
                />
                <small 
                  className="text-muted d-inline-block mt-2 fst-italic" 
                  style={{ wordBreak: 'break-all', padding: '0 1px' }}>
                  Original Source: {sourceUrlDefault}
                  <a href="#" onClick={handleCopy} title="Copy URL" className="ms-2" style={{ textDecoration: 'none' }}>
                    <i className="bi bi-copy"></i>
                  </a>
                </small>
              </div>
            )}
            {importType === 'file' && (
              <div className="mb-3 mt-3">
                <input
                  ref={fileInputRef}
                  className="d-none"
                  type="file"
                  id="formFile"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-dark w-100 d-flex justify-content-center align-items-center gap-2"
                  onClick={handleFileButtonClick}
                  style={{ minHeight: 48, height: 48, fontSize: 17 }}
                  disabled={loading}
                >
                  <i className="bi bi-upload" style={{ fontSize: 22 }}></i>
                  <span>{selectedFile ? selectedFile.name : 'Choose File'}</span>
                </button>
              </div>
            )}

            {loading && (
              <div className="position-relative">
                <div className="position-absolute" style={{top: 10}}>
                  <div className="alert alert-warning text-center mb-3" role="alert">
                    It's processing, this may take a few moments depending on file size.
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer d-flex flex-column align-items-start gap-3">
            <div className="form-check mt-5">
              <input
                className="form-check-input"
                id="notifySubscribers"
                type="checkbox"
                checked={notify}
                onChange={e => setNotify(e.target.checked)}
                disabled={loading}
              />
              <label className="form-check-label ps-1 me-3" htmlFor="notifySubscribers">Notify Subscribers</label>
            </div>
            {error && <div className="text-danger">{error}</div>}
            <div className="d-flex justify-content-start gap-1 m-0">
              <button
                type="button"
                className="btn btn-lg btn-modal fw-light m-0"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
              <button
                type="button"
                className="btn btn-lg btn-transparent fw-light m-0"
                data-bs-dismiss="modal"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportRateModal
