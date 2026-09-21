import { db } from "./firebase-config.js";
import { collection, query, where, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const SUPERVISOR_TO_GURU_FALLBACK = {
  SUP002: "GR048",
  SUP003: "GR049",
  SUP004: "GR050",
  SUP005: "GR051",
  SUP006: "GR052",
  SUP007: "GR053",
  SUP008: "GR054",
  SUP009: "GR055",
  SUP010: "GR056"
};

export async function resolveGuruIdForUser(userProfile) {
  const role = String(userProfile?.role || userProfile?.peran || "").toLowerCase();
  const ref = userProfile?.referensi_id || "";

  if (role === "guru") return ref;

  if (role === "supervisor") {
    // First try matching email, so the mapping remains robust if IDs change later.
    if (userProfile?.email) {
      const snap = await getDocs(query(collection(db, "guru"), where("email", "==", userProfile.email)));
      if (!snap.empty) return snap.docs[0].id;
    }

    // Fallback to the imported dual-role mapping.
    if (SUPERVISOR_TO_GURU_FALLBACK[ref]) return SUPERVISOR_TO_GURU_FALLBACK[ref];
  }

  return "";
}

export async function getGuruProfile(guruId) {
  if (!guruId) return null;
  const g = await getDoc(doc(db, "guru", guruId));
  return g.exists() ? { id: g.id, ...g.data() } : null;
}
