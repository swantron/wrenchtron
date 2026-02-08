import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getFirebaseStorage } from "./config";

export async function uploadReceipt(
  userId: string,
  vehicleId: string,
  file: File,
  filename: string
): Promise<string> {
  const path = `users/${userId}/vehicles/${vehicleId}/receipts/${filename}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
  });
  return path;
}

export async function getReceiptURL(path: string): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path);
  return getDownloadURL(storageRef);
}

export async function deleteReceipt(path: string): Promise<void> {
  const storageRef = ref(getFirebaseStorage(), path);
  return deleteObject(storageRef);
}

export async function uploadVehiclePhoto(
  userId: string,
  vehicleId: string,
  file: File
): Promise<string> {
  const path = `users/${userId}/vehicles/${vehicleId}/photo`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
  });
  return path;
}
