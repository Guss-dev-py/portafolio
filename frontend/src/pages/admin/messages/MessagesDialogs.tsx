import { ConfirmDialog } from '../../../components/ConfirmDialog/ConfirmDialog';
import { useMessagesPage } from './messagesContext';
import styles from '../admin.module.css';

export function MessagesDialogs() {
  const { checks, deletion } = useMessagesPage();

  return (
    <>
      <ConfirmDialog
        open={deletion.bulkOpen}
        title="Eliminar mensajes"
        body={
          <>¿Eliminar <strong>{checks.checked.size}</strong> mensaje(s) seleccionado(s)? Esta acción no se puede deshacer.</>
        }
        confirmLabel="Eliminar"
        onConfirm={deletion.runBulk}
        onCancel={deletion.cancelBulk}
      />

      <ConfirmDialog
        open={!!deletion.pending}
        title="Eliminar mensaje"
        body={
          <>
            ¿Eliminar el mensaje de <strong>{deletion.pending?.name}</strong>?
            {deletion.pending && (
              <p className={styles.confirmSnippet}>
                {deletion.pending.message.slice(0, 80)}...
              </p>
            )}
          </>
        }
        confirmLabel="Eliminar"
        onConfirm={deletion.run}
        onCancel={deletion.cancel}
      />
    </>
  );
}
