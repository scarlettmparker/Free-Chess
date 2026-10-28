import { useMemo } from 'react';
import { Avatar, Style } from '@dicebear/core';
import weaveSource from '@dicebear/styles/weave.json?raw';
import { useTranslation } from '@sun/i18n';
import styles from './profile-avatar.module.css';

/**
 * DiceBear style shared by every profile avatar.
 */
const style = new Style(JSON.parse(weaveSource));

/**
 * Background palette used by the Weave style.
 */
const backgroundColours = ['e7faf8', 'fff2dc', 'e8fbef', 'ffeee9', 'd8f3f4'];

type ProfileAvatarProps = {
  /**
   * Username used as the generation seed.
   */
  username: string;
  /**
   * Diameter in pixels.
   */
  size?: number;
};

/**
 * Deterministic Weave avatar for a username.
 */
const ProfileAvatar = (props: ProfileAvatarProps) => {
  const { username, size = 64 } = props;
  const { t } = useTranslation('profile');
  const source = useMemo(
    () =>
      new Avatar(style, {
        seed: username,
        backgroundColor: backgroundColours,
      }).toDataUri(),
    [username],
  );

  return (
    <img
      className={styles.avatar}
      src={source}
      width={size}
      height={size}
      alt={t('avatar-alt', { username })}
    />
  );
};

export default ProfileAvatar;
