import { Pressable, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

type PropsType = {
  isTitle: boolean;
  title?: string;
  placeholder: string;
  otherStyle?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  /** Use smaller padding and height for a more compact field */
  compact?: boolean;
};

const FormField = ({
  isTitle,
  title = "field",
  placeholder,
  otherStyle,
  keyboardType = "default",
  value,
  onChangeText,
  error,
  compact = false,
}: PropsType) => {
  const { colorScheme } = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  return (
    <View className={`   ${otherStyle} pt-1 `}>
      {isTitle && (
        <Text className={`font-medium dark:text-white ${compact ? "text-sm pb-1.5" : "text-base pb-2"}`}>
          {title}
        </Text>
      )}
      <View
        className={` flex-row border-x border-b-2 border-t ${
          error ? "border-red-500" : "border-n50 dark:border-n400"
        } bg-white dark:bg-n0 dark:text-white ${
          compact ? "rounded-lg px-3 py-1.5" : "rounded-xl p-3"
        }`}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#4A4A4A"
          className={` text-n50 dark:text-white flex-1 ${compact ? "text-sm min-h-0 py-0" : ""}`}
          style={compact ? { minHeight: 28, paddingVertical: 0 } : undefined}
          secureTextEntry={
            [
              "Password",
              "Old Password",
              "New Password",
              "Confirm Password",
              "New password",
            ].includes(title) && !showPassword
          }
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
        />
        {["Password", "Confirm Password", "New password"].includes(title) && (
          <Pressable
            className="self-center"
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={compact ? 14 : 16}
              color={colorScheme === "dark" ? "#B6B6B6" : "#4A4A4A"}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
};

export default FormField;
