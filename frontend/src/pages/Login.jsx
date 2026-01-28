import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    mfaCode: ''
  });
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({
        email: form.email,
        password: form.password,
        mfaCode: mfaRequired ? form.mfaCode : undefined
      });
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to sign in';
      setError(message);
      if (err.response?.data?.mfaRequired) {
        setMfaRequired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">BizVibe</span>
          <h1>Welcome back</h1>
          <p>Manage local visibility and reviews across Nairobi in one dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="hello@business.co.ke"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="********"
              required
            />
          </label>
          {mfaRequired && (
            <label>
              MFA code
              <input
                type="text"
                name="mfaCode"
                value={form.mfaCode}
                onChange={handleChange}
                placeholder="123456"
                required
              />
            </label>
          )}
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="auth-footer">
          <span>New to BizVibe?</span>
          <Link to="/register">Create your account</Link>
        </div>
      </div>
      <div className="auth-aside">
        <div className="auth-highlight">
          <h2>Local SEO autopilot</h2>
          <ul>
            <li>Automated Google Business Profile sync</li>
            <li>Review requests on SMS & WhatsApp</li>
            <li>Weekly Nairobi ranking intelligence</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
