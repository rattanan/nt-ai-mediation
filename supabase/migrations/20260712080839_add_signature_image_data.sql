alter table public.settlement_document_signatures
add column if not exists signature_image_data text;

alter table public.settlement_document_signatures
drop constraint if exists settlement_signature_image_data_format;

alter table public.settlement_document_signatures
add constraint settlement_signature_image_data_format check (
  signature_image_data is null
  or (
    signature_image_data like 'data:image/png;base64,%'
    and char_length(signature_image_data) <= 300000
  )
);

comment on column public.settlement_document_signatures.signature_image_data is
'PNG data URL captured from the signer drawing pad. Existing text-only signatures remain null.';
