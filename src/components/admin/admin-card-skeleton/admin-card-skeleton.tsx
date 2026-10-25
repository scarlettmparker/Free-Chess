import { Card, CardBody, Skeleton } from '@sun/components';
import styles from './admin-card-skeleton.module.css';

/**
 * Placeholder for one admin card.
 */
const AdminCardSkeleton = () => (
  <Card>
    <CardBody>
      <Skeleton className={styles.skeleton} />
    </CardBody>
  </Card>
);

export default AdminCardSkeleton;
