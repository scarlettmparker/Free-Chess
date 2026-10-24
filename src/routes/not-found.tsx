import { useTranslation } from '@sun/i18n';

/**
 * Fallback page.
 */
const NotFound = () => {
  const { t } = useTranslation('chess');
  return <p>{t('not-found')}</p>;
};

export default NotFound;
