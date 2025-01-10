import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || 'YOUR_CLIENT_ID';
const API_KEY = process.env.REACT_APP_API_KEY || 'YOUR_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly';
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/youtubeAnalytics/v2/rest',
];

function App() {
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const tokenClientRef = useRef(null); // Ref for tokenClient

  useEffect(() => {
    const loadGoogleApiScript = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.onload = initializeGapiClient;
      script.onerror = () => console.error('Error: Unable to load Google API.');
      document.body.appendChild(script);
    };

    const initializeGapiClient = () => {
      if (!window.gapi) return;

      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          console.log('Google APIs initialized');

          tokenClientRef.current = window.google?.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
              if (response.error) {
                console.error('Authentication error:', response.error);
                setCountdown('Authentication failed. Please try again.');
                setLoading(false);
              } else {
                console.log('Authentication successful:', response);

                // 1) Tell gapi.client to use the returned access token
                window.gapi.client.setToken({
                  access_token: response.access_token,
                });

                // 2) Now fetchData() calls will include the proper auth header
                fetchData();
              }
            },
          });
        } catch (error) {
          console.error('Error initializing Google APIs:', error);
        }
      });
    };

    loadGoogleApiScript();
  }, []);

  const handleAuthClick = () => {
    if (!window.gapi || !tokenClientRef.current) {
      console.error('Google API or Token Client not initialized.');
      setCountdown('Google API not ready. Please refresh and try again.');
      return;
    }

    setLoading(true);
    tokenClientRef.current.requestAccessToken();
  };

  const fetchData = async () => {
    try {
        console.log('Fetching subscriber count...');
        const subscriberResponse = await window.gapi.client.youtube.channels.list({
            part: 'statistics',
            mine: true,
        });

        if (!subscriberResponse.result.items || subscriberResponse.result.items.length === 0) {
            throw new Error('No channel data found. Ensure the authenticated account has a YouTube channel.');
        }

        const subscriberCount = parseInt(
            subscriberResponse.result.items[0].statistics.subscriberCount,
            10
        );

        console.log('Fetching subscriber growth rate...');
        
        // Use last 30 days as the date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // 30 days ago
        const analyticsResponse = await window.gapi.client.youtubeAnalytics.reports.query({
            ids: 'channel==MINE',
            metrics: 'subscribersGained',
            dimensions: 'day',
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
        });

        if (!analyticsResponse.result.rows || analyticsResponse.result.rows.length === 0) {
            throw new Error('No analytics data found. Ensure the channel has sufficient data.');
        }

        const totalSubscribersGained = analyticsResponse.result.rows.reduce(
            (total, row) => total + row[1],
            0
        );
        const avgDailyGrowth = totalSubscribersGained / analyticsResponse.result.rows.length;

        if (avgDailyGrowth <= 0) {
            setCountdown('Growth rate too low to estimate.');
            setLoading(false);
            return;
        }

        const remainingSubscribers = 100000 - subscriberCount;
        const estimatedDays = Math.ceil(remainingSubscribers / avgDailyGrowth);
        const years = Math.floor(estimatedDays / 365);
        const months = Math.floor((estimatedDays % 365) / 30);
        const days = (estimatedDays % 365) % 30;

    setCountdown(
    <>
        <div>You will reach 100K subscribers in:</div>
        <div id="estimate">{`${years} years, ${months} months, and ${days} days`}</div>
    </>
);
        setLoading(false);
    } catch (error) {
        console.error('Error fetching data:', error);
        setCountdown('Failed to fetch data. Please try again later.');
        setLoading(false);
    }
};

return (
  <div className="App">
    {/* Image Always Visible */}
    <img
      src="silver-play-button.jpg"
      alt="YouTube 100K Silver Play Button"
      className="play-button"
      style={{ margin: '20px auto', display: 'block', maxWidth: '300px' }}
    />
    {!countdown && (
      <header className="App-header">
        <h1>Countdown to 100K</h1>
        <p>
          How long until you reach 100K subscribers? <br />Click the button below to find out!
        </p>
      </header>
    )}
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

    {/* Conditionally Render Message and Footer */}
    {!countdown && (
      <>
        <p>
          This app is currently only available to test users.<br />
          Please{' '}
          <a href="https://linkedin.com/in/banksray" rel="nofollow noreferrer" target="_blank">
            contact me
          </a>{' '}
          if you want to try it out!
        </p>
        <footer style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9rem' }}>
          <p>
            <a href="/countdown-to-100k/terms-of-service.html">Terms of Service</a> |{' '}
            <a href="/countdown-to-100k/privacy-policy.html">Privacy Policy</a>
          </p>
        </footer>
      </>
    )}
  </div>
);
}
export default App;