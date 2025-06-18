import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DesignSystem from '../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ImagePickerComponentProps {
  onImageSelected: (imageUri: string) => void;
  currentImage?: string;
  placeholder?: string;
  style?: any;
  size?: 'small' | 'medium' | 'large';
  type?: 'avatar' | 'badge' | 'cover';
}

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  onImageSelected,
  currentImage,
  placeholder = 'Add Image',
  style,
  size = 'medium',
  type = 'avatar',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, borderRadius: 30 };
      case 'large':
        return { width: 120, height: 120, borderRadius: 60 };
      default:
        return { width: 80, height: 80, borderRadius: 40 };
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, borderRadius: 8 };
      case 'large':
        return { width: 120, height: 120, borderRadius: 16 };
      default:
        return { width: 80, height: 80, borderRadius: 12 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 40;
      default:
        return 24;
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const processImage = async (uri: string) => {
    try {
      setIsLoading(true);
      
      // Resize and compress the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: type === 'cover' ? 800 : 400 } }, // Resize to appropriate width
        ],
        {
          compress: 0.8, // 80% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      onImageSelected(manipulatedImage.uri);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
      setShowModal(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'badge' ? [1, 1] : type === 'cover' ? [16, 9] : [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: type === 'badge' ? [1, 1] : type === 'cover' ? [16, 9] : [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = () => {
    setShowModal(true);
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onImageSelected('') }
      ]
    );
  };

  const containerStyle = type === 'badge' ? getBadgeSize() : getSize();

  return (
    <>
      <TouchableOpacity
        style={[styles.container, containerStyle, style]}
        onPress={currentImage ? (isLoading ? undefined : showImageOptions) : showImageOptions}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={[styles.loadingContainer, containerStyle]}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        ) : currentImage ? (
          <>
            <Image source={{ uri: currentImage }} style={[styles.image, containerStyle]} />
            <TouchableOpacity
              style={styles.editButton}
              onPress={showImageOptions}
            >
              <Ionicons name="camera" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        ) : (
          <LinearGradient
            colors={[colors.background.secondary, colors.background.tertiary]}
            style={[styles.placeholder, containerStyle]}
          >
            <Ionicons 
              name={type === 'badge' ? 'shield-outline' : 'person-add'} 
              size={getIconSize()} 
              color={colors.text.tertiary} 
            />
            <Text style={[
              styles.placeholderText,
              { fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12 }
            ]}>
              {placeholder}
            </Text>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* Image Options Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Image</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={colors.primary.main} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={pickImageFromLibrary}>
              <Ionicons name="images" size={24} color={colors.primary.main} />
              <Text style={styles.modalOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            
            {currentImage && (
              <TouchableOpacity style={styles.modalOption} onPress={removeImage}>
                <Ionicons name="trash" size={24} color={colors.status.error} />
                <Text style={[styles.modalOptionText, { color: colors.status.error }]}>
                  Remove Image
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.modalCancel} 
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface.border,
    borderStyle: 'dashed',
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderText: {
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  loadingText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    margin: spacing.xl,
    minWidth: 250,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  modalOptionText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    marginLeft: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  modalCancelText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
});