import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import NoBusiness from '../components/NoBusiness';

const Settings = () => {
  const { selectedBusinessId, selectedBusiness, refreshBusinesses } = useBusiness();
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: '',
    category: '',
    address: '',
    phone: '',
    website: ''
  });
  const [gbpForm, setGbpForm] = useState({
    googleProfileId: '',
    accessToken: '',
    refreshToken: ''
  });
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (selectedBusiness) {
      setProfileForm({
        name: selectedBusiness.name || '',
        category: selectedBusiness.category || '',
        address: selectedBusiness.address || '',
        phone: selectedBusiness.phone || '',
        website: selectedBusiness.website || ''
      });
      setGbpForm((prev) => ({ ...prev, googleProfileId: selectedBusiness.googleProfileId || '' }));
    }
  }, [selectedBusiness]);

  const handleProfileChange = (event) => {
    setProfileForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleGbpChange = (event) => {
    setGbpForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    await api.patch(`/businesses/${selectedBusinessId}`, profileForm);
    await refreshBusinesses();
    setStatus('Business profile updated.');
  };

  const handleLinkGbp = async (event) => {
    event.preventDefault();
    await api.post(`/businesses/${selectedBusinessId}/link-gbp`, gbpForm);
    await refreshBusinesses();
    setStatus('Google Business Profile linked.');
  };

  const handleSyncGbp = async () => {
    await api.post(`/businesses/${selectedBusinessId}/gbp-sync`);
    await refreshBusinesses();
    setStatus('Business data synced from GBP.');
  };

  const handleSetupMfa = async () => {
    const { data } = await api.post('/auth/mfa/setup');
    setMfaSetup(data);
    setStatus('Scan the QR code with your authenticator app.');
  };

  const handleVerifyMfa = async (event) => {
    event.preventDefault();
    await api.post('/auth/mfa/verify', { token: mfaToken });
    updateUser({ mfaEnabled: true });
    setMfaSetup(null);
    setMfaToken('');
    setStatus('MFA enabled successfully.');
  };

  const handleDisableMfa = async () => {
    await api.post('/auth/mfa/disable', { token: mfaToken });
    updateUser({ mfaEnabled: false });
    setMfaToken('');
    setStatus('MFA disabled.');
  };

  if (!selectedBusinessId) {
    return (
      <NoBusiness
        title="Configure your business workspace"
        description="Select a business to update profile details and link Google Business Profile."
      />
    );
  }

  return (
    <div className="page-grid">
      {status && <div className="info-banner">{status}</div>}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Business profile</h3>
            <p>Update your Nairobi business information.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleUpdateProfile}>
          <input name="name" value={profileForm.name} onChange={handleProfileChange} placeholder="Name" required />
          <input name="category" value={profileForm.category} onChange={handleProfileChange} placeholder="Category" />
          <input name="address" value={profileForm.address} onChange={handleProfileChange} placeholder="Address" />
          <input name="phone" value={profileForm.phone} onChange={handleProfileChange} placeholder="Phone" />
          <input name="website" value={profileForm.website} onChange={handleProfileChange} placeholder="Website" />
          <button className="primary-button" type="submit">Save changes</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Google Business Profile</h3>
            <p>Link and sync your GBP to keep details aligned.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleLinkGbp}>
          <input
            name="googleProfileId"
            value={gbpForm.googleProfileId}
            onChange={handleGbpChange}
            placeholder="GBP location ID"
            required
          />
          <input
            name="accessToken"
            value={gbpForm.accessToken}
            onChange={handleGbpChange}
            placeholder="Google access token"
          />
          <input
            name="refreshToken"
            value={gbpForm.refreshToken}
            onChange={handleGbpChange}
            placeholder="Google refresh token"
          />
          <button className="secondary-button" type="submit">Link GBP</button>
        </form>
        <button className="ghost-button" type="button" onClick={handleSyncGbp}>
          Sync from GBP
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Multi-factor authentication</h3>
            <p>Protect your account with authenticator-based MFA.</p>
          </div>
        </div>
        <div className="mfa-box">
          <div>
            <strong>Status</strong>
            <p>{user?.mfaEnabled ? 'Enabled' : 'Not enabled'}</p>
          </div>
          <button className="secondary-button" type="button" onClick={handleSetupMfa}>
            {user?.mfaEnabled ? 'Reconfigure MFA' : 'Setup MFA'}
          </button>
        </div>
        {mfaSetup && (
          <div className="mfa-setup">
            <img src={mfaSetup.qrCode} alt="MFA QR code" />
            <form className="inline-form" onSubmit={handleVerifyMfa}>
              <input
                value={mfaToken}
                onChange={(event) => setMfaToken(event.target.value)}
                placeholder="Enter 6-digit code"
                required
              />
              <button className="primary-button" type="submit">Verify MFA</button>
            </form>
          </div>
        )}
        {user?.mfaEnabled && (
          <div className="inline-form">
            <input
              value={mfaToken}
              onChange={(event) => setMfaToken(event.target.value)}
              placeholder="Enter code to disable"
            />
            <button className="ghost-button" type="button" onClick={handleDisableMfa}>
              Disable MFA
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Settings;
