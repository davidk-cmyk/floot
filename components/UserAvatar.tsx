import React from 'react';
import { User } from '../helpers/User';
import { getAvatarProps } from '../helpers/avatarUtils';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';

interface UserAvatarProps {
  /**
   * The user object, must contain at least displayName and avatarUrl.
   */
  user: Pick<User, 'displayName' | 'avatarUrl' | 'oauthProvider'>;
  /**
   * Optional className to be applied to the root Avatar component.
   */
  className?: string;
}

/**
 * A component that encapsulates the logic for displaying a user's avatar.
 * It takes a user object and renders either their profile picture from `avatarUrl`
 * or their initials as a fallback, ensuring consistency across the application.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ user, className }) => {
  const avatarProps = getAvatarProps(user);

  return (
    <Avatar className={className}>
      <AvatarImage {...avatarProps.image} alt={`Avatar of ${user.displayName}`} />
      <AvatarFallback {...avatarProps.fallback} />
    </Avatar>
  );
};