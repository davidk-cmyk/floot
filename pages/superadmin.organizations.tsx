import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Building2, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, User as UserIcon } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import styles from "./superadmin.organizations.module.css";

interface Organization {
  id: number;
  name: string;
  slug: string;
  createdAt: string | null;
  userCount: number;
  adminEmail: string | null;
}

interface OrganizationUser {
  id: number;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  role: "admin" | "editor" | "approver" | "user";
  isActive: boolean;
  hasLoggedIn: boolean;
  createdAt: string | null;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface OrganizationsResponse {
  organizations: Organization[];
  pagination: PaginationInfo;
}

interface OrganizationUsersResponse {
  users: OrganizationUser[];
}

const SuperAdminOrganizationsPage = () => {
  const navigate = useNavigate();
  const { onLogin } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "userCount">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);
  const [confirmUser, setConfirmUser] = useState<{ user: OrganizationUser; org: Organization } | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery<OrganizationsResponse>({
    queryKey: ["superadmin", "organizations", { page, search: debouncedSearch, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/_api/superadmin/organizations?${params}`);
      if (!res.ok) {
        throw new Error("Failed to load organizations");
      }
      return res.json();
    },
  });

  // Query for organization users when expanded
  const { data: usersData, isLoading: usersLoading } = useQuery<OrganizationUsersResponse>({
    queryKey: ["superadmin", "organization-users", expandedOrg],
    queryFn: async () => {
      const res = await fetch(`/_api/superadmin/organization-users?organizationId=${expandedOrg}`);
      if (!res.ok) {
        throw new Error("Failed to load users");
      }
      return res.json();
    },
    enabled: expandedOrg !== null,
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const toggleExpand = (orgId: number) => {
    setExpandedOrg(expandedOrg === orgId ? null : orgId);
  };

  const handleImpersonate = (user: OrganizationUser, org: Organization) => {
    setConfirmUser({ user, org });
  };

  const confirmImpersonate = async () => {
    if (!confirmUser) return;

    setIsImpersonating(true);
    try {
      const res = await fetch("/_api/superadmin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: confirmUser.user.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to impersonate");
      }

      const data = await res.json();
      // Update auth state with new user data
      onLogin(data.user, false);
      // Navigate to the org's admin dashboard
      navigate(`/${confirmUser.org.id}/admin/dashboard`);
    } catch (error) {
      console.error("Impersonation failed:", error);
      alert(error instanceof Error ? error.message : "Failed to start impersonation. Please try again.");
    } finally {
      setIsImpersonating(false);
      setConfirmUser(null);
    }
  };

  const getSortIndicator = (column: typeof sortBy) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return styles.roleAdmin;
      case "editor": return styles.roleEditor;
      case "approver": return styles.roleApprover;
      default: return styles.roleUser;
    }
  };

  return (
    <>
      <Helmet>
        <title>Organizations | Super Admin</title>
      </Helmet>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Building2 size={28} />
            Organizations
          </h1>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.search}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading organizations...</div>
        ) : error ? (
          <div className={styles.error}>Failed to load organizations. Please try again.</div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.expandHeader}></th>
                    <th>ID</th>
                    <th
                      onClick={() => handleSort("name")}
                      className={styles.sortable}
                    >
                      Name{getSortIndicator("name")}
                    </th>
                    <th>Slug</th>
                    <th>Admin</th>
                    <th
                      onClick={() => handleSort("userCount")}
                      className={styles.sortable}
                    >
                      Users{getSortIndicator("userCount")}
                    </th>
                    <th
                      onClick={() => handleSort("createdAt")}
                      className={styles.sortable}
                    >
                      Created{getSortIndicator("createdAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.organizations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        No organizations found
                      </td>
                    </tr>
                  ) : (
                    data?.organizations.map((org) => (
                      <React.Fragment key={org.id}>
                        <tr
                          className={`${styles.orgRow} ${expandedOrg === org.id ? styles.expanded : ""}`}
                          onClick={() => toggleExpand(org.id)}
                        >
                          <td className={styles.expandCell}>
                            {expandedOrg === org.id ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </td>
                          <td className={styles.idCell}>{org.id}</td>
                          <td className={styles.nameCell}>{org.name}</td>
                          <td className={styles.slugCell}>{org.slug}</td>
                          <td>{org.adminEmail || <em className={styles.noAdmin}>No admin</em>}</td>
                          <td>{org.userCount}</td>
                          <td>
                            {org.createdAt
                              ? new Date(org.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                        {expandedOrg === org.id && (
                          <tr className={styles.usersRow}>
                            <td colSpan={7}>
                              <div className={styles.usersContainer}>
                                <h3 className={styles.usersTitle}>Users in {org.name}</h3>
                                {usersLoading ? (
                                  <div className={styles.usersLoading}>Loading users...</div>
                                ) : usersData?.users.length === 0 ? (
                                  <div className={styles.noUsers}>No users in this organization</div>
                                ) : (
                                  <table className={styles.usersTable}>
                                    <thead>
                                      <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Logged In</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {usersData?.users.map((user) => (
                                        <tr key={user.id}>
                                          <td className={styles.userName}>
                                            <UserIcon size={14} className={styles.userIcon} />
                                            {user.displayName}
                                          </td>
                                          <td className={styles.userEmail}>{user.email}</td>
                                          <td>
                                            <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                                              {user.role}
                                            </span>
                                          </td>
                                          <td>
                                            {user.isActive ? (
                                              <span className={styles.statusActive}>Active</span>
                                            ) : (
                                              <span className={styles.statusInactive}>Inactive</span>
                                            )}
                                          </td>
                                          <td className={styles.loginStatus}>
                                            {user.hasLoggedIn ? "Yes" : "Never"}
                                          </td>
                                          <td>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleImpersonate(user, org);
                                              }}
                                              className={styles.loginAsButton}
                                              disabled={!user.isActive}
                                              title={!user.isActive ? "Cannot impersonate inactive user" : `Login as ${user.displayName}`}
                                            >
                                              Login As
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {data && data.pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles.pageButton}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data.pagination.totalPages}
                  className={styles.pageButton}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmUser && (
        <div className={styles.modalOverlay} onClick={() => setConfirmUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Impersonate User</h2>
            <p className={styles.modalMessage}>
              You are about to view as:
            </p>
            <div className={styles.modalUserInfo}>
              <p className={styles.modalUserName}>{confirmUser.user.displayName}</p>
              <p className={styles.modalUserEmail}>{confirmUser.user.email}</p>
              <p className={styles.modalUserRole}>
                Role: <span className={`${styles.roleBadge} ${getRoleBadgeClass(confirmUser.user.role)}`}>
                  {confirmUser.user.role}
                </span>
              </p>
              <p className={styles.modalOrgName}>
                Organization: {confirmUser.org.name}
              </p>
            </div>
            <p className={styles.modalWarning}>
              All actions will be logged. You will have the same permissions as this user.
            </p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setConfirmUser(null)}
                className={styles.cancelButton}
                disabled={isImpersonating}
              >
                Cancel
              </button>
              <button
                onClick={confirmImpersonate}
                className={styles.confirmButton}
                disabled={isImpersonating}
              >
                {isImpersonating ? "Starting..." : "Confirm & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminOrganizationsPage;
