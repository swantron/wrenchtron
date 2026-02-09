import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "./config";
import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";

// ---- Vehicle CRUD ----

function vehiclesCollection(userId: string) {
  return collection(getFirebaseDb(), "users", userId, "vehicles");
}

function vehicleDoc(userId: string, vehicleId: string) {
  return doc(getFirebaseDb(), "users", userId, "vehicles", vehicleId);
}

export async function addVehicle(
  userId: string,
  data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
) {
  return addDoc(vehiclesCollection(userId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateVehicle(
  userId: string,
  vehicleId: string,
  data: Partial<Omit<Vehicle, "id" | "createdAt" | "updatedAt">>
) {
  return updateDoc(vehicleDoc(userId, vehicleId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteVehicle(userId: string, vehicleId: string) {
  return deleteDoc(vehicleDoc(userId, vehicleId));
}

export async function getVehicle(userId: string, vehicleId: string) {
  const snap = await getDoc(vehicleDoc(userId, vehicleId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Vehicle;
}

export function subscribeToVehicles(
  userId: string,
  callback: (vehicles: Vehicle[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(vehiclesCollection(userId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const vehicles = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Vehicle
      );
      callback(vehicles);
    },
    (error) => {
      console.error("Firestore vehicles subscription error:", error);
      onError?.(error);
    }
  );
}

// ---- Maintenance Log CRUD ----

function maintenanceCollection(userId: string, vehicleId: string) {
  return collection(
    getFirebaseDb(),
    "users",
    userId,
    "vehicles",
    vehicleId,
    "maintenanceLogs"
  );
}

function maintenanceDoc(userId: string, vehicleId: string, logId: string) {
  return doc(
    getFirebaseDb(),
    "users",
    userId,
    "vehicles",
    vehicleId,
    "maintenanceLogs",
    logId
  );
}

export async function addMaintenanceLog(
  userId: string,
  vehicleId: string,
  data: Omit<MaintenanceLog, "id" | "createdAt" | "updatedAt">
) {
  const logRef = await addDoc(maintenanceCollection(userId, vehicleId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Auto-update vehicle currentMileage
  if (data.mileage) {
    await updateDoc(vehicleDoc(userId, vehicleId), {
      currentMileage: data.mileage,
      updatedAt: serverTimestamp(),
    });
  }

  return logRef;
}

export async function updateMaintenanceLog(
  userId: string,
  vehicleId: string,
  logId: string,
  data: Partial<Omit<MaintenanceLog, "id" | "createdAt" | "updatedAt">>
) {
  return updateDoc(maintenanceDoc(userId, vehicleId, logId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMaintenanceLog(
  userId: string,
  vehicleId: string,
  logId: string
) {
  return deleteDoc(maintenanceDoc(userId, vehicleId, logId));
}

export async function getMaintenanceLog(
  userId: string,
  vehicleId: string,
  logId: string
) {
  const snap = await getDoc(maintenanceDoc(userId, vehicleId, logId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as MaintenanceLog;
}

export function subscribeToMaintenanceLogs(
  userId: string,
  vehicleId: string,
  callback: (logs: MaintenanceLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    maintenanceCollection(userId, vehicleId),
    orderBy("date", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as MaintenanceLog
      );
      callback(logs);
    },
    (error) => {
      console.error("Firestore maintenance logs subscription error:", error);
      onError?.(error);
    }
  );
}
