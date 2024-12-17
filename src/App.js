import React, { useState, useEffect } from 'react';
import './App.css';

const CLIENT_ID =
  process.env.REACT_APP_CLIENT_ID || 'YOUR_CLIENT_ID';
const API_KEY =
  process.env.REACT_APP_API_KEY || 'YOUR_API_KEY';
const SCOPES =
  'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly';
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/youtubeAnalytics/v2/rest',
];

function App() {
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(false);
  let tokenClient;

  useEffect(() => {
    const loadGoogleApiScript = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.onload = initializeGapiClient;
      script.onerror = () =>
        console.error('Error: Unable to load Google API.');
      document.body.appendChild(script);
    };

    const initializeGapiClient = () => {
      if (!window.gapi) return;

      window.gapi.load('client', () => {
        window.gapi.client
          .init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          })
          .then(() => console.log('Google API initialized'))
          .catch((error) => console.error('Error:', error));
      });
    };

    loadGoogleApiScript();

    tokenClient = window.google?.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          setCountdown('Authentication failed. Please try again.');
          setLoading(false);
        } else {
          fetchChannelData();
        }
      },
    });
  }, []);

  const handleAuthClick = () => {
    setLoading(true);
    tokenClient.requestAccessToken();
  };

  const fetchChannelData = async () => {
    try {
      const response = await window.gapi.client.youtube.channels.list({
        part: 'statistics',
        mine: true,
      });
      const subscriberCount = parseInt(
        response.result.items[0].statistics.subscriberCount,
        10
      );
      setCountdown(`Current Subscribers: ${subscriberCount}`);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  return (
    <div className="App">ee
      {/* Image Always Visible */}
      <img
        src="silver-play-button.jpg"
        alt="YouTube 100K Silver Play Button"
        className="play-button"
        style={{ margin: '20px auto', display: 'block', maxWidth: '300px' }}
      />

      {/* Static Content Hidden When Countdown Appears */}
      {!countdown && (
        <header className="App-header">
          <h1>Countdown to 100K by Ray Banks</h1>
          <p>
            This app helps YouTube creators estimate how long it will take to
            reach 100,000 subscribers using their current growth rate.
          </p>
          <p>
            Your data is securely accessed via the YouTube API. We do not store
            or share your information. Learn more in our{' '}
            <a href="/countdown-to-100k/privacy-policy.html">
              Privacy Policy
            </a>.
          </p>
        </header>
      )}

      {/* Button or Countdown Result */}
      {countdown ? (
        <div>
          <h2>{countdown}</h2>
        </div>
      ) : (
        <div>
          <button onClick={handleAuthClick} disabled={loading}>
            {loading ? 'Loading...' : 'Connect to YouTube'}
          </button>
        </div>
      )}

      {/* Footer Always Visible */}
      <footer style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9rem' }}>
        <p>
          <a href="/countdown-to-100k/terms-of-service.html">
            Terms of Service
          </a>{' '}
          |{' '}
          <a href="/countdown-to-100k/privacy-policy.html">
            Privacy Policy
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
