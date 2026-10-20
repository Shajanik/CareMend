import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiGetProfile, apiUpdateProfile, getStoredUser, AuthUser } from '../config/authService';
import { HealthData } from '../types';

const B = '#800000'; // burgundy
const BL = '#fdf0f0'; // burgundy light

interface Props {
  onBack: () => void;
  healthData?: HealthData | null;
  riskCategory?: 'LOW' | 'MEDIUM' | 'HIGH';
}

const Profile: React.FC<Props> = ({ onBack, healthData, riskCategory }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable form state
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    dob: '',
    gender: '',
    blood_type: '',
    emergency_contact: '',
    allergies: '',
    medications: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const result = await apiGetProfile();
    if (result.ok && result.user) {
      setUser(result.user);
      setFormData({
        full_name: result.user.full_name || '',
        mobile: result.user.mobile || '',
        dob: result.user.dob || '',
        gender: result.user.gender || '',
        blood_type: result.user.blood_type || '',
        emergency_contact: result.user.emergency_contact || '',
        allergies: result.user.allergies || '',
        medications: result.user.medications || '',
      });
    } else {
      // Fallback to localStorage
      const stored = getStoredUser();
      if (stored) {
        setUser(stored);
        setFormData({
          full_name: stored.full_name || '',
          mobile: stored.mobile || '',
          dob: stored.dob || '',
          gender: stored.gender || '',
          blood_type: stored.blood_type || '',
          emergency_contact: stored.emergency_contact || '',
          allergies: stored.allergies || '',
          medications: stored.medications || '',
        });
      } else {
        setError('Unable to load profile');
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    console.log('🔵 [Profile] Save button clicked');
    console.log('🔵 [Profile] Form data to save:', formData);
    
    setSaving(true);
    setError(null);
    
    const result = await apiUpdateProfile(formData);
    
    console.log('🔵 [Profile] API response:', result);
    
    if (result.ok && result.user) {
      console.log('✅ [Profile] Save successful, updating UI with:', result.user);
      setUser(result.user);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      console.error('❌ [Profile] Save failed:', result.error);
      setError(result.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        mobile: user.mobile || '',
        dob: user.dob || '',
        gender: user.gender || '',
        blood_type: user.blood_type || '',
        emergency_contact: user.emergency_contact || '',
        allergies: user.allergies || '',
        medications: user.medications || '',
      });
    }
    setEditMode(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f6' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: B }}></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f6' }}>
        <div className="text-center">
          <p className="text-red-600 mb-4">Unable to load profile</p>
          <button onClick={onBack} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#faf8f6' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-black tracking-wide" style={{ color: B }}>
            CAREMEND
          </div>
          <button 
            onClick={onBack}
            className="btn-secondary flex items-center gap-2"
          >
            <i className="fas fa-arrow-left icon-md"></i>
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}
      {success && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: B }}>
              My Profile
            </h1>
            <p className="text-gray-600">
              Manage your personal information and health data
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Picture & Basic Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-center">
                  <div 
                    className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white"
                    style={{ background: `linear-gradient(135deg, ${B} 0%, #5a0000 100%)` }}
                  >
                    <i className="fas fa-user"></i>
                  </div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: B }}>
                    {user.full_name}
                  </h2>
                  <p className="text-gray-500 text-sm mb-4">{user.email}</p>
                  {!editMode ? (
                    <button 
                      onClick={() => setEditMode(true)}
                      className="btn-primary w-full"
                    >
                      <i className="fas fa-pencil-alt icon-md"></i>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary w-full"
                      >
                        <i className="fas fa-check icon-md"></i>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        onClick={handleCancel}
                        disabled={saving}
                        className="btn-secondary w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: B }}>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Full Name</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-600">{user.full_name || 'Not set'}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Phone</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-600">{user.mobile || 'Not set'}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Date of Birth</label>
                    {editMode ? (
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-600">{user.dob || 'Not set'}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Gender</label>
                    {editMode ? (
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-gray-600">{user.gender || 'Not set'}</p>
                    )}
                  </div>

                  {/* Blood Type */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Blood Type</label>
                    {editMode ? (
                      <select
                        value={formData.blood_type}
                        onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    ) : (
                      <p className="text-gray-600">{user.blood_type || 'Not set'}</p>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Emergency Contact</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.emergency_contact}
                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                        placeholder="Name - Phone"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-600">{user.emergency_contact || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Data */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4" style={{ color: B }}>
                  Health Information
                </h3>
                
                {healthData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Risk Level</label>
                      <p className="text-gray-600 capitalize">{riskCategory?.toLowerCase() || 'Not assessed'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Age</label>
                      <p className="text-gray-600">{healthData.age || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Activity Level</label>
                      <p className="text-gray-600">{healthData.activityLevel || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Calcium Level</label>
                      <p className="text-gray-600">{healthData.calciumLevel || 'N/A'}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Medications */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Current Medications</label>
                    {editMode ? (
                      <textarea
                        value={formData.medications}
                        onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                        placeholder="Enter medications (comma-separated)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <ul className="space-y-1">
                        {user.medications ? (
                          user.medications.split(',').map((med, index) => (
                            <li key={index} className="text-gray-600 text-sm flex items-center gap-2">
                              <i className="fas fa-pills text-xs" style={{ color: B }}></i>
                              {med.trim()}
                            </li>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No medications listed</p>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Allergies</label>
                    {editMode ? (
                      <textarea
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        placeholder="Enter allergies (comma-separated)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <ul className="space-y-1">
                        {user.allergies ? (
                          user.allergies.split(',').map((allergy, index) => (
                            <li key={index} className="text-gray-600 text-sm flex items-center gap-2">
                              <i className="fas fa-exclamation-triangle text-xs text-red-500"></i>
                              {allergy.trim()}
                            </li>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No allergies listed</p>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
