import React, { useState } from 'react';
import axios from 'axios';
import useAreas from '../hooks/useAreas';
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
  
  // Use areas hook with fallback enabled
  const { areasArray, areasLoading, areasError } = useAreas({
    autoLoad: true,
    fallbackToDefault: true,
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
      
      console.log('📤 Submitting contact form:', formData);
      
      // 🔧 FIXED: Use the working API URL directly
      const API_URL = 'https://property-dealing-4a4n.onrender.com';
      
      console.log(`🔗 Using API URL: ${API_URL}/api/contacts`);
      
      // Submit to backend API using fetch (more reliable than axios for this)
      const response = await fetch(`${API_URL}/api/contacts`, {
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
      console.log('✅ Contact form submitted successfully:', responseData);
      
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

  const handleLocationClick = () => {
    const address = "S-1 Skytech Matrott Market, Sector-76, Noida (U.P) 201307";
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
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
      title: 'Visit Us',
      content: 'S-1 Skytech Matrott Market\nSector-76, Noida (U.P) 201307',
      onClick: handleLocationClick
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
    console.log('🔄 Rendering interest options:', { areasLoading, areasError, areasArray });
    
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
          <h2>Contact Us</h2>
          <p>Get in touch with our expert team for personalized real estate solutions</p>
        </div>
        
        <div className="contact-grid">
          <div className="contact-info">
            <h3>Get In Touch</h3>
            <div className="contact-items-wrapper">
              {contactItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`contact-item ${item.onClick ? 'contact-item-clickable' : ''}`}
                  onClick={item.onClick}
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
            <h3>Send Us a Message</h3>
            
            {submitSuccess && (
              <div className="form-message success">
                <i className="fas fa-check-circle"></i>
                <p>Thank you for your message! We will get back to you soon.</p>
              </div>
            )}
            
            {submitError && (
              <div className="form-message error">
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
