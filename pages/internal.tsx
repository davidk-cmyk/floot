import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganization } from "../helpers/useOrganization";
import { Skeleton } from "../components/Skeleton";

const InternalPoliciesPage: React.FC = () => {
  const location = useLocation();
  const { organizationState } = useOrganization();
  
  const searchParams = location.search;

  // If organization is loading, show skeleton
  if (organizationState.type === 'loading') {
    return <Skeleton style={{ height: '100vh', width: '100%' }} />;
  }

  // If organization is active, redirect to organization-scoped internal portal
  if (organizationState.type === 'active') {
    const redirectPath = `/${organizationState.currentOrganization.id}/internal${searchParams}`;
    return <Navigate to={redirectPath} replace />;
  }

  // If not authenticated or no organization available, redirect to organization selector
  // The actual selector route will be determined by the router based on authentication state
  return <Navigate to="/" replace />;
};

export default InternalPoliciesPage;