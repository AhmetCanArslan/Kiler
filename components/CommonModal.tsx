import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

interface CommonModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode | ((props: { handleClose: () => void }) => React.ReactNode);
  animationType?: 'slide' | 'fade' | 'none';
  maxHeight?: string | number;
  minHeight?: string | number;
}


export const CommonModal: React.FC<CommonModalProps> = ({
  visible,
  onClose,
  children,
  animationType = 'none',
  maxHeight = '70%',
  minHeight = 370,
}) => {
  const modalAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      Animated.parallel([
        Animated.timing(modalAnim, {
          toValue: 1,
          duration: 167,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 133,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ]).start();
    } else if (!closingRef.current) {
      modalAnim.setValue(0);
      backdropAnim.setValue(0);
    }
  }, [visible, modalAnim, backdropAnim]);

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 133,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      })
    ]).start(() => {
      requestAnimationFrame(() => {
        onClose();
      });
    });
  };

  return (
    <Modal
      animationType={animationType}
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      {/* Backdrop: koyu ve blur (iOS için BlurView, Android için koyu yarı opak) */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleClose}
      >
        {/* iOS için BlurView, Android için koyu View */}
        {Platform.OS === 'ios' ? (
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.18],
                }),
                // iOS için blur efekti
                backdropFilter: 'blur(12px)',
              },
            ]}
          />
        ) : (
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.22],
                }),
                backgroundColor: 'rgba(20,24,31,0.96)',
              },
            ]}
          />
        )}
      </TouchableOpacity>
      {/* Modal Content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={0}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
          style={{ width: '100%' }}
        >
          <Animated.View
            style={[
              {
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [350, 0],
                    }),
                  },
                ],
                opacity: modalAnim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 0.5, 1],
                }),
              }
            ]}
          >
            <View
              style={[
                styles.modalContent,
                maxHeight ? { maxHeight: maxHeight as any } : {},
                minHeight ? { minHeight: minHeight as any } : {},
              ]}
            >
              {/* children'a handleClose fonksiyonunu prop olarak geçiyoruz */}
              {typeof children === 'function' ? children({ handleClose }) : children}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(20, 24, 31, 0.92)", // Koyu ve opak, inline verilmez
  },
  modalContent: {
    backgroundColor: "#1A202C", 
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#2D3748",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    minHeight: 370,
  },
});
