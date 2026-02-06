import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PageTitle from "@/components/ui/PageTitle";
import topBgBackground from "@/assets/images/top-bg-shape.png";
import FormField from "@/components/inputFields/FormField";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const nextErrors = { email: "", password: "" };

    if (!email.trim()) {
      nextErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      nextErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const handleSignIn = () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }

    // No backend/Firebase here – just continue into the application     
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-b50 dark:bg-n50">
      <ScrollView className="flex-1">
        <View className="pb-16">
          <View className="absolute w-full top-0 left-0 right-0">
            <Image
              source={topBgBackground}
              className="w-full h-[250px] -mt-20"
            />
          </View>
          <PageTitle pageName="Sign In" />
        </View>

        <View className="pt-14 px-6">
          <Text className="text-sm text-n400 dark:text-n500">
            Welcome! Let's explore exciting features designed to enhance your
            experience and make life easier.
          </Text>
          <View className="pt-7">
            <FormField
              isTitle={true}
              title="Email"
              placeholder="Enter email"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: "" });
                }
              }}
              error={errors.email}
            />
          </View>
          <View className="pt-4">
            <FormField
              isTitle={true}
              title="Password"
              placeholder="******"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: "" });
                }
              }}
              error={errors.password}
            />
          </View>
        </View>

        <View className="pt-12 px-6 pb-8">
          <View className="pb-7">
            <Text
              onPress={handleSignIn}
              className="block w-full rounded-xl py-3 text-center font-semibold text-white bg-p1"
            >
              Sign In
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;

const styles = StyleSheet.create({});

