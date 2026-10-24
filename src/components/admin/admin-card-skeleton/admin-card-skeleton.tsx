import { Card, CardBody, CardHeader, Skeleton } from '@sun/components';
import styles from './admin-card-skeleton.module.css';

/**
 * Placeholder for one admin card.
 */
const AdminCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton />
    </CardHeader>
    <CardBody>
      <div className={styles.body}>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </CardBody>
  </Card>
);

export default AdminCardSkeleton;
