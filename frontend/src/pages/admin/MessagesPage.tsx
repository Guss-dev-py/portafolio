import { MessagesProvider } from './messages/MessagesProvider';
import { MessagesHeader } from './messages/MessagesHeader';
import { MessagesStats } from './messages/MessagesStats';
import { MessageFilters } from './messages/MessageFilters';
import { MessagesBody } from './messages/MessagesBody';
import { MessagesDialogs } from './messages/MessagesDialogs';
import styles from './admin.module.css';

/**
 * Composición de la página. Todo el estado vive en `MessagesProvider` y cada
 * pieza lo lee del contexto, así que este archivo describe el layout y nada más.
 */
export default function MessagesPage() {
  return (
    <MessagesProvider>
      <div className={styles.page}>
        <MessagesHeader />
        <MessagesStats />
        <MessageFilters />
        <MessagesBody />
        <MessagesDialogs />
      </div>
    </MessagesProvider>
  );
}
