import React from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';

const SettingsPage = () => {
  return (
    <Layout>
      <div>
        <h1>Settings Page</h1>
        <p>Settings and configurations will go here.</p>
      </div>
    </Layout>
  );
};

export default SettingsPage;
