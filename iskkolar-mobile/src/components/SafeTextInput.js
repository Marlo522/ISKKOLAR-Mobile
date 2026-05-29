import React, { useCallback } from "react";
import { TextInput } from "react-native";

/**
 * Regex that matches emoji and other symbol characters that can cause issues
 * with backend processing. Uses standard hex ranges for universal compatibility
 * across all JavaScript engines (including older Hermes builds).
 */
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{FE0F}]/gu;

/**
 * Strips emoji characters from a string.
 * @param {string} text
 * @returns {string}
 */
export const stripEmojis = (text) => {
  if (!text) return text;
  return text.replace(EMOJI_REGEX, "");
};

/**
 * A drop-in replacement for React Native's TextInput that automatically
 * strips emoji characters from user input to prevent backend errors.
 *
 * Usage: Replace `import { TextInput } from "react-native"` with
 *        `import SafeTextInput from "../components/SafeTextInput"`
 *        then use `<SafeTextInput ...>` instead of `<TextInput ...>`.
 */
const SafeTextInput = React.forwardRef(({ onChangeText, ...rest }, ref) => {
  const handleChangeText = useCallback(
    (text) => {
      const sanitized = stripEmojis(text);
      if (onChangeText) {
        onChangeText(sanitized);
      }
    },
    [onChangeText]
  );

  return <TextInput ref={ref} {...rest} onChangeText={handleChangeText} />;
});

SafeTextInput.displayName = "SafeTextInput";

export default SafeTextInput;
