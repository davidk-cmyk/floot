import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganization } from "../helpers/useOrganization";
import { Skeleton } from "../components/Skeleton";

const PublicPoliciesPage: React.FC = () => {
  const location = useLocation();
  const { organizationState } = useOrganization();
  
  const searchParams = location.search;

  // If organization is loading, show skeleton
  if (organizationState.type === 'loading') {
    return <Skeleton style={{ height: '100vh', width: '100%' }} />;
  }

  // If organization is active, redirect to organization-scoped public portal
  if (organizationState.type === 'active') {
    const redirectPath = `/${organizationState.currentOrganization.id}/public${searchParams}`;
    return <Navigate to={redirectPath} replace />;
  }

  // For public pages without organization, redirect to generic public portal
  const redirectPath = `/portal/public${searchParams}`;
  return <Navigate to={redirectPath} replace />;
};

export default PublicPoliciesPage;