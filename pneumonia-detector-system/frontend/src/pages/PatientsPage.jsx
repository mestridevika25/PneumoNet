import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addPatient,
  deletePatient,
  deletePredictionsByPatient,
  onPatientsSnapshot,
  onPredictionsSnapshot,
} from '../services/firebaseService';

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingPatientId, setDeletingPatientId] = useState('');
  const [error, setError] = useState('');
  const [latestPredictionByPatient, setLatestPredictionByPatient] = useState({});

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onPatientsSnapshot((rows) => {
      setPatients(rows);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onPredictionsSnapshot((rows) => {
      const latestByPatient = rows.reduce((acc, prediction) => {
        const patientId = prediction.patientId ?? prediction.patient_id;
        if (!patientId) return acc;

        const timestamp = Number(prediction.timestamp ?? 0);
        const existing = acc[patientId];
        const existingTs = Number(existing?.timestamp ?? 0);

        if (!existing || timestamp >= existingTs) {
          acc[patientId] = prediction;
        }
        return acc;
      }, {});

      setLatestPredictionByPatient(latestByPatient);
    });

    return () => unsubscribe();
  }, []);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setError('');

    const name = newPatientName.trim();
    const age = Number(newPatientAge);

    if (!name) {
      setError('Name is required.');
      return;
    }

    if (!Number.isFinite(age) || age <= 0) {
      setError('Please enter a valid age.');
      return;
    }

    setSubmitting(true);
    try {
      await addPatient({
        name,
        age,
        last_hr: 0,
        last_spo2: 0,
        last_prediction: 'None',
        xray_image: '',
      });

      setNewPatientName('');
      setNewPatientAge('');
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to add patient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (patientId) => {
    if (!patientId) return;
    setSelectedPatientId(patientId);
    navigate(`/xray-upload?patient=${encodeURIComponent(patientId)}`, {
      state: { patientId },
    });
  };

  const handleDeletePatient = async (patientId) => {
    if (!patientId) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this patient?');
    if (!confirmDelete) return;

    setDeletingPatientId(patientId);
    setError('');

    try {
      await deletePredictionsByPatient(patientId);
      await deletePatient(patientId);
    } catch (err) {
      setError('Failed to delete patient. Please try again.');
    } finally {
      setDeletingPatientId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--color-text-primary]">Patients</h1>
          <p className="text-sm text-[--color-text-secondary]">Patient records with current vitals and latest prediction</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setShowAddForm((prev) => !prev);
            setError('');
          }}
        >
          Add Patient
        </button>
      </div>

      {showAddForm && (
        <div className="glass-card p-4">
          <form className="space-y-3" onSubmit={handleAddPatient}>
            <div>
              <label htmlFor="patient-name" className="block text-sm text-[--color-text-secondary] mb-2">Name</label>
              <input
                id="patient-name"
                type="text"
                className="input-dark"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="patient-age" className="block text-sm text-[--color-text-secondary] mb-2">Age</label>
              <input
                id="patient-age"
                type="number"
                min="1"
                className="input-dark"
                value={newPatientAge}
                onChange={(e) => setNewPatientAge(e.target.value)}
                placeholder="45"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setError('');
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Patient'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[--color-text-secondary]">
                <th className="px-5 py-4 font-medium">Patient ID</th>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Age</th>
                <th className="px-5 py-4 font-medium">HR</th>
                <th className="px-5 py-4 font-medium">SpO2</th>
                <th className="px-5 py-4 font-medium">Last Prediction</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[--color-text-secondary]">Loading…</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[--color-text-secondary]">No patients found.</td></tr>
              ) : (
                patients.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedPatientId === (p.patient_id || p.id) ? 'bg-white/[0.02]' : ''}`}
                    onClick={() => handleRowClick(p.patient_id || p.id)}
                  >
                    {(() => {
                      const patientId = p.patient_id || p.id;
                      const latestPrediction = latestPredictionByPatient[patientId] || {};
                      const hrValue = Number(latestPrediction.hr ?? latestPrediction.heart_rate ?? p.last_hr);
                      const spo2Value = Number(latestPrediction.spo2 ?? p.last_spo2);
                      const displayHr = Number.isFinite(hrValue) && hrValue > 0 ? hrValue : '—';
                      const displaySpo2 = Number.isFinite(spo2Value) && spo2Value > 0 ? spo2Value : '—';

                      return (
                        <>
                    <td className="px-5 py-4 text-[--color-text-secondary] font-mono text-xs">{p.patient_id || p.id}</td>
                    <td className="px-5 py-4 text-[--color-text-primary] font-medium">{p.name}</td>
                    <td className="px-5 py-4 text-[--color-text-secondary]">{p.age}</td>
                    <td className="px-5 py-4 text-[--color-text-secondary]">{displayHr}</td>
                    <td className="px-5 py-4 text-[--color-text-secondary]">{displaySpo2}</td>
                    <td className="px-5 py-4 text-[--color-text-secondary]">
                      {p.last_prediction || '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/xray-upload?patient=${encodeURIComponent(p.patient_id || p.id)}`}
                        className="btn-primary !py-2 !px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View / Upload X-ray
                      </Link>
                      <button
                        type="button"
                        style={{
                          background: '#FF6B6B',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          marginLeft: '8px',
                        }}
                        disabled={deletingPatientId === (p.patient_id || p.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePatient(p.patient_id || p.id);
                        }}
                      >
                        {deletingPatientId === (p.patient_id || p.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                        </>
                      );
                    })()}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
