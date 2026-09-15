/** Contrato do SELECT — coluna real é `uploaded_by` (não existe `created_by` nesta tabela). */
export const ACTION_ITEM_ATTACHMENTS_SELECT =
  "id, action_item_id, organization_id, storage_bucket, storage_path, original_file_name, upload_status, mime_type, file_size, caption, created_at, uploaded_by";
