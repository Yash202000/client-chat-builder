import React, { useEffect } from 'react';

const GoogleCallback: React.FC = () => {
  useEffect(() => {
    // The backend handles the code exchange. This page's script, sent from the
    // backend, will message the parent window and then close itself.
  }, []);

  return <div>Authenticating with Google... Please wait.</div>;
};

export default GoogleCallback;