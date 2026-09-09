import { randomUUID } from 'expo-crypto';

import { supabase } from '@/lib/supabase';

export type ReceiptPhoto = {
  uri: string;
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};

export async function uploadReceipt(householdId: string, photo: ReceiptPhoto) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('not_authenticated');
  // React Native uploads need an ArrayBuffer, not Blob/FormData.
  const binary = atob(photo.base64);
  if (binary.length > 5 * 1024 * 1024) throw new Error('photo_too_large');
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const extension =
    photo.mimeType === 'image/png' ? 'png' : photo.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${householdId}/${user.id}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, bytes.buffer, { contentType: photo.mimeType });
  if (error) throw error;
  return path;
}

export async function getReceiptUrl(path: string) {
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}
