import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
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
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">BizVibe</span>
          <h1>Start your Nairobi growth stack</h1>
          <p>Launch your local SEO automation workspace in minutes.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Business owner name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Amina Mwangi"
              required
            />
          </label>
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
              placeholder="Create a strong password"
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
      <div className="auth-aside">
        <div className="auth-highlight">
          <h2>Built for SMEs in Nairobi</h2>
          <p>
            Track every keyword, automate every review request, and turn your Google Business Profile
            into a growth engine.
          </p>
          <div className="stats-mini">
            <div>
              <strong>45%</strong>
              <span>avg. visibility lift</span>
            </div>
            <div>
              <strong>3x</strong>
              <span>faster review velocity</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>rank monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
