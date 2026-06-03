import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyATNJ0MENV5k7-sh3DFykpSMxVvZ852ZiE",
  authDomain: "fest-9eb3c.firebaseapp.com",
  projectId: "fest-9eb3c",
  storageBucket: "fest-9eb3c.firebasestorage.app",
  messagingSenderId: "1032376437441",
  appId: "1:1032376437441:web:12fdfd5a12f1c260652240",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
export const db = getFirestore(app);

export const uploadProfileImage = async (
  userId: number,
  file: File
): Promise<string> => {
  const safeFileName = file.name.replace(/\s+/g, "-");
  const fileRef = ref(
    storage,
    `profile-images/${userId}/${Date.now()}-${safeFileName}`
  );

  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

export const uploadPostMedia = async (
  userId: number,
  file: File
): Promise<string> => {
  const safeFileName = file.name.replace(/\s+/g, "-");
  const fileRef = ref(
    storage,
    `post-media/${userId}/${Date.now()}-${safeFileName}`
  );

  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

export default storage;
