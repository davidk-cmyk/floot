import React from 'react';
import { useParams } from 'react-router-dom';
import { LegacyRedirect } from '../components/LegacyRedirect';

export default function PolicyEditRedirect() {
  const { policyId } = useParams<{ policyId: string }>();
  return <LegacyRedirect pagePath={`policies/${policyId}/edit`} />;
}