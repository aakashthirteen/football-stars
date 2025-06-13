import {
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  View,
  ViewProps,
  ScrollViewProps,
} from 'react-native';
import React, { ReactNode } from 'react';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  extraScrollHeight?: number;
  enableOnAndroid?: boolean;
  extraHeight?: number;
  keyboardOpeningTime?: number;
}

export const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps> = ({
  children,
  extraScrollHeight = 0,
  enableOnAndroid = true,
  extraHeight = 100,
  keyboardOpeningTime = 250,
  ...scrollViewProps
}) => {
  const shouldEnable = Platform.OS === 'ios' || enableOnAndroid;

  if (!shouldEnable) {
    return (
      <ScrollView {...scrollViewProps}>
        {children}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={extraHeight}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

interface DismissKeyboardViewProps extends ViewProps {
  children: ReactNode;
}

export const DismissKeyboardView: React.FC<DismissKeyboardViewProps> = ({
  children,
  ...viewProps
}) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View {...viewProps}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};

export const dismissKeyboard = () => {
  Keyboard.dismiss();
};

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
};

export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return isKeyboardVisible;
};

// Keyboard-aware container that adjusts content when keyboard appears
interface KeyboardAwareContainerProps extends ViewProps {
  children: ReactNode;
  offset?: number;
}

export const KeyboardAwareContainer: React.FC<KeyboardAwareContainerProps> = ({
  children,
  offset = 0,
  style,
  ...viewProps
}) => {
  const keyboardHeight = useKeyboardHeight();

  return (
    <View
      style={[
        style,
        {
          marginBottom: keyboardHeight > 0 ? keyboardHeight + offset : 0,
        },
      ]}
      {...viewProps}
    >
      {children}
    </View>
  );
};
