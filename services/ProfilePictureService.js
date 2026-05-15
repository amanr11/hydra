// services/ProfilePictureService.js
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth'; 
import { auth } from '../firebase';
import * as ImagePicker from 'expo-image-picker';

class ProfilePictureService {
  static async pickAndUploadImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return { success: false, error: 'Permission denied' };

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, 
      });

      if (result.canceled) return { success: false, error: 'Cancelled' };

      const uri = result.assets[0].uri;
      const user = auth.currentUser;
      if (!user) return { success: false, error: 'Not authenticated' };

      const storage = getStorage();
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // FIX: This updates the Firebase Auth profile so it persists across logins
      await updateProfile(user, { photoURL: downloadURL });
      
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getProfilePicture(userId) {
    try {
      // Check the auth object first as it's the fastest
      if (auth.currentUser?.photoURL) return { success: true, url: auth.currentUser.photoURL };
      
      const storage = getStorage();
      const storageRef = ref(storage, `users/${userId}/profile.jpg`);
      const url = await getDownloadURL(storageRef);
      return { success: true, url };
    } catch (error) {
      return { success: false };
    }
  }
}

export default ProfilePictureService;