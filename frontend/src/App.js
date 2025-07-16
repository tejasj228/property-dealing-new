import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Contact from './components/Contact';
import Properties from './components/Properties';
import PropertyDetail from './components/PropertyDetail';
import Societies from './components/Societies';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Header />
          <main>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={
                  <PageTransition>
                    <Home />
                  </PageTransition>
                } />
                <Route path="/contact" element={
                  <PageTransition>
                    <Contact />
                  </PageTransition>
                } />
                <Route path="/properties" element={<Properties />} />
                <Route path="/property/:id" element={
                  <PageTransition>
                    <PropertyDetail />
                  </PageTransition>
                } />
                <Route path="/societies/:areaKey/:subAreaId" element={
                  <PageTransition>
                    <Societies />
                  </PageTransition>
                } />
                <Route path="/listings/:area" element={
                  <PageTransition>
                    <Properties />
                  </PageTransition>
                } />
                {/* Catch all route for 404s */}
                <Route path="*" element={
                  <div style={{
                    padding: '50px',
                    textAlign: 'center',
                    minHeight: '400px'
                  }}>
                    <h2>Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                    <button 
                      onClick={() => window.location.href = '/'}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#B8860B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginTop: '20px'
                      }}
                    >
                      Go Home
                    </button>
                  </div>
                } />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
          <ScrollToTop />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;