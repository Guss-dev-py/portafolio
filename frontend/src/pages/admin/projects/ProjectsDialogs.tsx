import { ConfirmDialog } from '../../../components/ConfirmDialog/ConfirmDialog';
import { useProjectsPage } from './projectsContext';

export function ProjectsDialogs() {
  const { form, deletion } = useProjectsPage();

  return (
    <>
      <ConfirmDialog
        open={form.confirmDiscard}
        title="Descartar cambios"
        body={<>Hay cambios sin guardar en el formulario. ¿Descartarlos?</>}
        confirmLabel="Descartar"
        onConfirm={form.close}
        onCancel={form.dismissDiscard}
      />

      <ConfirmDialog
        open={!!deletion.pending}
        title="Eliminar proyecto"
        body={
          <>
            ¿Eliminar <strong>{deletion.pending?.name}</strong>? Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        onConfirm={deletion.run}
        onCancel={deletion.cancel}
      />
    </>
  );
}
