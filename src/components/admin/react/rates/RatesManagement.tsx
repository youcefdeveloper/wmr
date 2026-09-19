import React, { useEffect, useState } from 'react';
import { client } from '@config/client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAdminThemeStore } from '@stores/admin/theme.store';

interface Rate {
  id: string;
  week: string;
  us30YrFrm: number;
  us15YrFrm: number;
}

const RatesManagement = () => {
  const theme = useAdminThemeStore(state => state.theme)
    
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRate, setNewRate] = useState({
    week: '',
    us30YrFrm: '',
    us15YrFrm: '',
  });

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [editFields, setEditFields] = useState({
    week: '',
    us30YrFrm: '',
    us15YrFrm: '',
  });

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRateId, setDeleteRateId] = useState<string | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/v1/us-weekly-data-manual');
      setRates(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  };

  // Add Rate
  const handleAddRate = async () => {
    try {
      await client.post('/api/v1/us-weekly-data-manual', {
        week: newRate.week,
        us30YrFrm: parseFloat(newRate.us30YrFrm),
        us15YrFrm: parseFloat(newRate.us15YrFrm),
      });
      setShowAddModal(false);
      setNewRate({ week: '', us30YrFrm: '', us15YrFrm: '' });
      fetchRates();
      toast.success('Rate added');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add rate');
    }
  };

  // Edit Rate
  const openEditModal = async (rate: Rate) => {
    setEditingRate(rate);
    setEditFields({
      week: rate.week,
      us30YrFrm: rate.us30YrFrm.toString(),
      us15YrFrm: rate.us15YrFrm.toString(),
    });
    setShowEditModal(true);
  };

  const handleEditRate = async () => {
    if (!editingRate) return;
    try {
      await client.put(`/api/v1/us-weekly-data-manual/${editingRate.id}`,
        {
          week: editFields.week,
          us30YrFrm: parseFloat(editFields.us30YrFrm),
          us15YrFrm: parseFloat(editFields.us15YrFrm),
        }
      );
      setShowEditModal(false);
      setEditingRate(null);
      fetchRates();
      toast.success('Rate updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update rate');
    }
  };

  // Delete Rate
  const openDeleteModal = (id: string) => {
    setDeleteRateId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteRate = async () => {
    if (!deleteRateId) return;
    try {
      await client.delete(`/api/v1/us-weekly-data-manual/${deleteRateId}`);
      setShowDeleteModal(false);
      setDeleteRateId(null);
      fetchRates();
      toast.success('Rate deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete rate');
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme={theme === 'dark' ? 'dark' : 'light'} />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">US Weekly Rates</h4>
        <button className="btn btn-outline-dark" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-lg me-1"></i>New Rate
        </button>
      </div>
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : rates.length === 0 ? (
        <div className="d-flex justify-content-center py-5">
          <p className="lead fw-light">No rates found.</p>
        </div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Week</th>
              <th>30 Yr FRM</th>
              <th>15 Yr FRM</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate, idx) => (
              <tr key={rate.id}>
                <td>{idx + 1}</td>
                <td>{rate.week}</td>
                <td>{rate.us30YrFrm}</td>
                <td>{rate.us15YrFrm}</td>
                <td>
                  <a href="#" className="me-2" title="Edit" onClick={e => {e.preventDefault(); openEditModal(rate);}}>
                    <i className="bi bi-pen"></i>
                  </a>
                  <a href="#" title="Delete" onClick={e => {e.preventDefault(); openDeleteModal(rate.id);}}>
                    <i className="bi bi-trash"></i>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Rate Modal */}
      {showAddModal && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Add New Rate</h1>
                  <a href="#" className="bi bi-x-lg h4 mb-0" onClick={e => {e.preventDefault(); setShowAddModal(false);}}></a>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label mb-0">Week (YYYY-MM-DD)</label>
                    <input type="date" className="form-control form-control-lg" value={newRate.week} onChange={e => setNewRate({...newRate, week: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-0">30 Yr FRM</label>
                    <input type="number" step="0.01" className="form-control form-control-lg" value={newRate.us30YrFrm} onChange={e => setNewRate({...newRate, us30YrFrm: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-0">15 Yr FRM</label>
                    <input type="number" step="0.01" className="form-control form-control-lg" value={newRate.us15YrFrm} onChange={e => setNewRate({...newRate, us15YrFrm: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-lg btn-modal fw-light m-0" onClick={handleAddRate} disabled={!newRate.week || !newRate.us30YrFrm || !newRate.us15YrFrm}>Add</button>
                  <button type="button" className="btn btn-lg btn-transparent fw-light m-0" onClick={() => setShowAddModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Edit Rate Modal */}
      {showEditModal && editingRate && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Edit Rate</h1>
                  <a href="#" className="bi bi-x-lg h4 mb-0" onClick={e => {e.preventDefault(); setShowEditModal(false); setEditingRate(null);}}></a>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label mb-0">Week (YYYY-MM-DD)</label>
                    <input type="date" className="form-control form-control-lg" value={editFields.week} onChange={e => setEditFields({...editFields, week: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-0">30 Yr FRM</label>
                    <input type="number" step="0.01" className="form-control form-control-lg" value={editFields.us30YrFrm} onChange={e => setEditFields({...editFields, us30YrFrm: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-0">15 Yr FRM</label>
                    <input type="number" step="0.01" className="form-control form-control-lg" value={editFields.us15YrFrm} onChange={e => setEditFields({...editFields, us15YrFrm: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-lg btn-modal fw-light m-0" onClick={handleEditRate} disabled={!editFields.week || !editFields.us30YrFrm || !editFields.us15YrFrm}>Save</button>
                  <button type="button" className="btn btn-lg btn-transparent fw-light m-0" onClick={() => {setShowEditModal(false); setEditingRate(null);}}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Delete Rate Modal */}
      {showDeleteModal && (
        <>
          <div className="modal modal-alert fade show" tabIndex={-1} style={{ display: 'block' }}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Delete Rate</h1>
                  <a href="#" className="bi bi-x-lg h4 mb-0" onClick={e => {e.preventDefault(); setShowDeleteModal(false); setDeleteRateId(null);}}></a>
                </div>
                <div className="modal-body">
                  <p className="lead">Are you sure you want to delete this rate?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-lg btn-modal btn-danger fw-light" onClick={handleDeleteRate}>Confirm</button>
                  <button type="button" className="btn btn-lg btn-transparent fw-light" onClick={() => {setShowDeleteModal(false); setDeleteRateId(null);}}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default RatesManagement;
