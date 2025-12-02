import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../helpers/useAuth';
import { useOrganization } from '../helpers/useOrganization';
import { Skeleton } from './Skeleton';

interface LegacyRedirectProps {
  pagePath: string;
}

export const LegacyRedirect = ({ pagePath }: LegacyRedirectProps) => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { organizationState } = useOrganization();

  useEffect(() => {
    if (authState.type === 'unauthenticated') {
      navigate('/login', { replace: true });
    } else if (authState.type === 'authenticated' && organizationState.type === 'active') {
      navigate(`/${organizationState.currentOrganization.id}/admin/${pagePath}`, { replace: true });
    }
  }, [authState, organizationState, navigate, pagePath]);

  // Show loading skeleton while redirecting
  return <Skeleton style={{ height: '100vh', width: '100%' }} />;
};