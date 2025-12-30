import React, { useState, useMemo } from "react";
import { useUsers } from "../helpers/useUsers";
import { useUserManagement } from "../helpers/useUserManagement";
import { UserListItem } from "../endpoints/users/list_GET.schema";
import { UserRole, UserRoleArrayValues } from "../helpers/schema";
import { useAuth } from "../helpers/useAuth";
import { formatRoleName } from "../helpers/formatRoleName";
import { Input } from "./Input";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "./Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { MoreHorizontal, Trash2, UserX, KeyRound, UserCog, Copy, Check } from "lucide-react";
import styles from "./UserManagementTable.module.css";

type UserAction = "delete" | "toggle-active" | "drop-password" | "update-role" | "show-password";

interface PasswordDialogState {
  password: string;
  user: UserListItem;
}

const UserManagementTable: React.FC = () => {
  const { data, isFetching, error } = useUsers();
  const { authState } = useAuth();
  const {
    useDeleteUser,
    useToggleUserActive,
    useDropUserPassword,
    useUpdateUserRole,
  } = useUserManagement();

  const [filter, setFilter] = useState("");
  const [dialogState, setDialogState] = useState<{
    action: UserAction | null;
    user: UserListItem | null;
  }>({ action: null, user: null });
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  const [passwordDialogState, setPasswordDialogState] = useState<PasswordDialogState | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const deleteUserMutation = useDeleteUser();
  const toggleUserActiveMutation = useToggleUserActive();
  const dropUserPasswordMutation = useDropUserPassword();
  const updateUserRoleMutation = useUpdateUserRole();

  const currentUser = authState.type === "authenticated" ? authState.user : null;

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(filter.toLowerCase()) ||
        user.email.toLowerCase().includes(filter.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(filter.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(filter.toLowerCase()))
    );
  }, [data, filter]);

  const openDialog = (action: UserAction, user: UserListItem) => {
    setDialogState({ action, user });
    if (action === "update-role") {
      setNewRole(user.role);
    }
  };

  const closeDialog = () => {
    setDialogState({ action: null, user: null });
    setNewRole(null);
  };

  const closePasswordDialog = () => {
    setPasswordDialogState(null);
    setCopySuccess(false);
  };

  const copyToClipboard = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy password:", error);
    }
  };

  const handleConfirm = () => {
    if (!dialogState.action || !dialogState.user) return;

    switch (dialogState.action) {
      case "delete":
        deleteUserMutation.mutate({ userId: dialogState.user.id });
        break;
      case "toggle-active":
        toggleUserActiveMutation.mutate({
          userId: dialogState.user.id,
          isActive: !dialogState.user.isActive,
        });
        break;
      case "drop-password":
        dropUserPasswordMutation.mutate(
          { userId: dialogState.user.id },
          {
            onSuccess: (result) => {
              if ("password" in result) {
                setPasswordDialogState({
                  password: result.password,
                  user: dialogState.user!,
                });
              }
            },
          }
        );
        break;
      case "update-role":
        if (newRole) {
          updateUserRoleMutation.mutate({
            userId: dialogState.user.id,
            role: newRole,
          });
        }
        break;
    }
    closeDialog();
  };

  const renderDialogContent = () => {
    if (!dialogState.action || !dialogState.user) return null;

    const user = dialogState.user;
    switch (dialogState.action) {
      case "delete":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete{" "}
                <strong>{user.displayName}</strong>? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </>
        );
      case "toggle-active":
        const isActivating = !user.isActive;
        return (
          <>
            <DialogHeader>
              <DialogTitle>
                {isActivating ? "Activate" : "Deactivate"} User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {isActivating ? "activate" : "deactivate"}{" "}
                <strong>{user.displayName}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleConfirm}
                disabled={toggleUserActiveMutation.isPending}
              >
                {toggleUserActiveMutation.isPending
                  ? "Updating..."
                  : isActivating
                  ? "Activate"
                  : "Deactivate"}
              </Button>
            </DialogFooter>
          </>
        );
      case "drop-password":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Generate New Password</DialogTitle>
              <DialogDescription>
                This will generate a new random password for{" "}
                <strong>{user.displayName}</strong>. Their current password will be replaced.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleConfirm}
                disabled={dropUserPasswordMutation.isPending}
              >
                {dropUserPasswordMutation.isPending
                  ? "Generating..."
                  : "Generate Password"}
              </Button>
            </DialogFooter>
          </>
        );
      case "update-role":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Update Role</DialogTitle>
              <DialogDescription>
                Select a new role for <strong>{user.displayName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className={styles.dialogBody}>
              <Select
                value={newRole ?? undefined}
                onValueChange={(value) => setNewRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {UserRoleArrayValues.map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatRoleName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleConfirm}
                disabled={updateUserRoleMutation.isPending || !newRole}
              >
                {updateUserRoleMutation.isPending ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </>
        );
    }
  };

  if (isFetching && !data) {
    return (
      <div>
        <div className={styles.tableHeader}>
          <Skeleton className={styles.filterInputSkeleton} />
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {[...Array(6)].map((_, i) => (
                  <th key={i}>
                    <Skeleton style={{ height: "1rem" }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j}>
                      <Skeleton style={{ height: "1.5rem" }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <h3>Error loading users</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <Dialog open={!!dialogState.action} onOpenChange={(open) => !open && closeDialog()}>
        <div className={styles.container}>
          <div className={styles.tableHeader}>
            <Input
              placeholder="Filter by name or email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Login Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userName}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.displayName
                          }
                        </div>
                        <div className={styles.userEmail}>{user.email}</div>
                        {user.firstName && user.lastName && user.displayName !== `${user.firstName} ${user.lastName}` && (
                          <div className={styles.userDisplayName}>({user.displayName})</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="secondary">
                        {formatRoleName(user.role)}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={user.isActive ? "success" : "outline"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={user.hasLoggedIn ? "default" : "warning"}>
                        {user.hasLoggedIn ? "Logged In" : "Never Logged In"}
                      </Badge>
                    </td>
                    <td>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      {currentUser?.id !== user.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={() => openDialog("update-role", user)}
                            >
                              <UserCog size={14} />
                              <span>Change Role</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => openDialog("toggle-active", user)}
                            >
                              <UserX size={14} />
                              <span>
                                {user.isActive ? "Deactivate" : "Activate"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => openDialog("drop-password", user)}
                            >
                              <KeyRound size={14} />
                              <span>Generate Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => openDialog("delete", user)}
                              className={styles.destructiveItem}
                            >
                              <Trash2 size={14} />
                              <span>Delete User</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>

      {/* Password Display Dialog */}
      <Dialog open={!!passwordDialogState} onOpenChange={(open) => !open && closePasswordDialog()}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>New Password Generated</DialogTitle>
            <DialogDescription>
              A new password has been generated for{" "}
              <strong>{passwordDialogState?.user.displayName}</strong>.
              Please copy this password and provide it to the user securely.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.passwordContainer}>
            <div className={styles.passwordDisplay}>
              <code className={styles.password}>
                {passwordDialogState?.password}
              </code>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => passwordDialogState && copyToClipboard(passwordDialogState.password)}
                className={styles.copyButton}
              >
                {copySuccess ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            {copySuccess && (
              <div className={styles.copySuccess}>
                Password copied to clipboard!
              </div>
            )}
          </div>
          <div className={styles.passwordInstructions}>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This password will only be shown once</li>
              <li>The user's previous password is no longer valid</li>
              <li>Provide this password to the user through a secure channel</li>
              <li>The user should change this password after their first login</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={closePasswordDialog}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { UserManagementTable };