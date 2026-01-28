import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { formatDate } from '../utils/formatters';
import NoBusiness from '../components/NoBusiness';

const Reviews = () => {
  const { selectedBusinessId } = useBusiness();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [requestForm, setRequestForm] = useState({
    recipient: '',
    channel: 'sms',
    reviewLink: '',
    message: ''
  });
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    rating: 5,
    reviewText: '',
    source: 'manual'
  });
  const [status, setStatus] = useState('');

  const fetchReviews = async () => {
    if (!selectedBusinessId) return;
    const [reviewsResponse, summaryResponse] = await Promise.all([
      api.get(`/businesses/${selectedBusinessId}/reviews`),
      api.get(`/businesses/${selectedBusinessId}/reviews/summary`)
    ]);
    setReviews(reviewsResponse.data.reviews || []);
    setSummary(summaryResponse.data.summary || null);
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedBusinessId]);

  const handleRequestChange = (event) => {
    setRequestForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleReviewChange = (event) => {
    setReviewForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSendRequest = async (event) => {
    event.preventDefault();
    setStatus('Sending review request...');
    await api.post(`/businesses/${selectedBusinessId}/review-requests`, requestForm);
    setStatus('Review request sent.');
  };

  const handleAddReview = async (event) => {
    event.preventDefault();
    await api.post(`/businesses/${selectedBusinessId}/reviews`, reviewForm);
    setReviewForm({ customerName: '', rating: 5, reviewText: '', source: 'manual' });
    await fetchReviews();
  };

  const breakdown = useMemo(() => summary?.breakdown || [], [summary]);

  if (!selectedBusinessId) {
    return (
      <NoBusiness
        title="See every review in one place"
        description="Select a business to automate review requests and track sentiment."
      />
    );
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Review intelligence</h3>
            <p>Capture feedback and automate review growth.</p>
          </div>
          <div className="tag">Google + WhatsApp</div>
        </div>
        <div className="stat-row">
          <div>
            <span>Average rating</span>
            <strong>{summary?.averageRating?.toFixed(1) || '0.0'}</strong>
          </div>
          <div>
            <span>Total reviews</span>
            <strong>{summary?.totalReviews || 0}</strong>
          </div>
          <div>
            <span>Latest feedback</span>
            <strong>{reviews[0] ? formatDate(reviews[0].created_at) : 'N/A'}</strong>
          </div>
        </div>
        <div className="pill-row">
          {breakdown.length ? (
            breakdown.map((item) => (
              <span key={item.rating} className="pill neutral">
                {item.rating} star - {item.count}
              </span>
            ))
          ) : (
            <span className="pill neutral">No breakdown yet</span>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Automated review request</h3>
            <p>Send SMS or WhatsApp nudges after customer visits.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleSendRequest}>
          <input
            name="recipient"
            value={requestForm.recipient}
            onChange={handleRequestChange}
            placeholder="+254712345678"
            required
          />
          <select name="channel" value={requestForm.channel} onChange={handleRequestChange}>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <input
            name="reviewLink"
            value={requestForm.reviewLink}
            onChange={handleRequestChange}
            placeholder="Google review link"
            required
          />
          <input
            name="message"
            value={requestForm.message}
            onChange={handleRequestChange}
            placeholder="Custom message (optional)"
          />
          <button className="primary-button" type="submit">
            Send request
          </button>
        </form>
        {status && <div className="info-banner">{status}</div>}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Manual review capture</h3>
            <p>Log feedback received via phone or walk-in.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleAddReview}>
          <input
            name="customerName"
            value={reviewForm.customerName}
            onChange={handleReviewChange}
            placeholder="Customer name"
          />
          <select name="rating" value={reviewForm.rating} onChange={handleReviewChange}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} stars
              </option>
            ))}
          </select>
          <input
            name="reviewText"
            value={reviewForm.reviewText}
            onChange={handleReviewChange}
            placeholder="Review message"
          />
          <input
            name="source"
            value={reviewForm.source}
            onChange={handleReviewChange}
            placeholder="Source (Google, WhatsApp, walk-in)"
          />
          <button className="secondary-button" type="submit">
            Add review
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Recent reviews</h3>
            <p>Latest feedback collected across channels.</p>
          </div>
        </div>
        <div className="list">
          {reviews.length ? (
            reviews.map((review) => (
              <div key={review.id} className="list-item">
                <div>
                  <strong>{review.customer_name || 'Anonymous'}</strong>
                  <p>{review.review_text || 'No text provided'}</p>
                  <small>{formatDate(review.created_at)}</small>
                </div>
                <span className="pill neutral">{review.rating} star - {review.source}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">No reviews yet.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reviews;
