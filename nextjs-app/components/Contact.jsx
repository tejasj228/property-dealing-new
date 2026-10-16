'use client';
import React, { useState } from 'react';
import useAreas from '@/hooks/useAreas';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    message: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Use published areas only
  const { areasArray, areasLoading, areasError } = useAreas({
    autoLoad: true,
    fallbackToDefault: false,
    enableCache: false
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear any previous error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      
      // Submit to backend API (same-origin Next.js API routes)
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          interest: formData.interest.trim(),
          message: formData.message.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Show success message
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        interest: '',
        message: ''
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error submitting contact form:', error);
      
      // Handle different types of errors
      if (error.message.includes('404')) {
        setSubmitError('Contact service is temporarily unavailable. Please try again later.');
      } else if (error.message.includes('400')) {
        setSubmitError('Please check your information and try again.');
      } else if (error.message.includes('500')) {
        setSubmitError('Server error occurred. Please try again later.');
      } else if (error.message.includes('Failed to fetch')) {
        setSubmitError('Unable to connect to our servers. Please check your internet connection and try again.');
      } else {
        setSubmitError('Failed to send message. Please try again or contact us directly at pawan127jitendra@gmail.com');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Contact methods
  const handleEmailClick = (email) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handlePhoneClick = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleLocationClick = (url) => {
    window.open(url, '_blank');
  };

  const contactItems = [
    {
      icon: 'fas fa-envelope',
      title: 'Email Us',
      content: 'pawan127jitendra@gmail.com',
      onClick: () => handleEmailClick('pawan127jitendra@gmail.com')
    },
    {
      icon: 'fas fa-phone',
      title: 'Call Us',
      content: '+91-9811186086\n+91-9811186083\n0120-3244364',
      onClick: () => handlePhoneClick('+91-9811186086')
    },
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Office 1 — Noida',
      content: 'Shop No.1, SKYTECH MATROTT, Market,\nSkytech Matrott, Aditya Celebrity Homes,\nSector 76, Noida, Uttar Pradesh 201316',
      onClick: () => handleLocationClick('https://maps.app.goo.gl/F4oyJaHCwG5fEHzn8?g_st=iw')
    },
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Office 2 — Greater Noida',
      content: 'GF 90 & 96 Gaur Runway Suites,\nGaur Yamuna City Sec-19,\nYamuna Expressway, Greater Noida - 203201',
      onClick: () => handleLocationClick('https://maps.google.com/?q=28.306482,77.558189')
    },
    {
      icon: 'fas fa-clock',
      title: 'Working Hours',
      content: 'Tuesday to Sunday\n10:00 AM - 7:00 PM',
      onClick: null
    }
  ];

  // Render interest dropdown options
  const renderInterestOptions = () => {
    
    if (areasLoading) {
      return (
        <option value="" disabled>
          Loading areas...
        </option>
      );
    }

    if (areasError && areasArray.length === 0) {
      return (
        <option value="">Areas not available</option>
      );
    }

    return (
      <>
        <option value="">Select an area of interest</option>
        {areasArray.map((area) => (
          <option key={area.key} value={area.key}>
            {area.displayName}
          </option>
        ))}
      </>
    );
  };

  return (
    <div className="contact-page">
      <div className="container">
        <div className="section-title">
          <span className="page-kicker">Contact</span><h1>Let’s talk about your next move.</h1>
          <p>A home, a plot, a space for your business. Tell us what you have in mind, or visit either of our offices.</p>
        </div>
        
        <div className="contact-grid">
          <div className="contact-info">
            <h3>Come say hello.</h3>
            <div className="contact-items-wrapper">
              {contactItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`contact-item ${item.onClick ? 'contact-item-clickable' : ''}`}
                  onClick={item.onClick}
                  role={item.onClick ? 'link' : undefined}
                  tabIndex={item.onClick ? 0 : undefined}
                  onKeyDown={e => { if (item.onClick && e.key === 'Enter') item.onClick(); }}
                  style={item.onClick ? { cursor: 'pointer' } : { cursor: 'default' }}
                >
                  <div className="contact-item-icon">
                    <i className={item.icon}></i>
                  </div>
                  <div className="contact-item-content">
                    <h4>{item.title}</h4>
                    <p>{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-form">
            <h3>What are you looking for?</h3>
            
            {submitSuccess && (
              <div className="form-message success" role="status">
                <i className="fas fa-check-circle"></i>
                <p>Thank you for your message! We will get back to you soon.</p>
              </div>
            )}
            
            {submitError && (
              <div className="form-message error" role="alert">
                <i className="fas fa-exclamation-circle"></i>
                <p>{submitError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  autoComplete="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  autoComplete="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="interest">Area of Interest</label>
                <select
                  id="interest"
                  name="interest"
                  value={formData.interest}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  {renderInterestOptions()}
                </select>
                {areasLoading && (
                  <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '5px' }}></i>
                    Loading available areas...
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your requirements..."
                  disabled={submitting}
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending Message...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
