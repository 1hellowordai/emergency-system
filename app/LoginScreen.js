import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_BASE_URL, formatApiHttpError } from "../config/api";

export default function Login() {
  const [mode, setMode] = useState("login");

  // login
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");

  // register
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [organization, setOrganization] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    if (!loginName.trim() || !password.trim()) {
      Alert.alert("Алдаа", "Хэрэглэгчийн нэр болон нууц үгээ оруулна уу.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: loginName,
        password: password,
      });

      if (res.data?.data) {
        Alert.alert("Амжилттай", "Нэвтэрлээ");
        router.replace("/home");
      } else {
        Alert.alert("Алдаа", "Нэвтрэх мэдээлэл буруу байна");
      }
    } catch (err) {
      const errorMsg = formatApiHttpError(err);
      Alert.alert("Алдаа", errorMsg);
    }
  };

  // 📝 REGISTER API
  const handleRegister = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert("Алдаа", "Бүх талбарыг бөглөнө үү");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: `${lastName} ${firstName}`.trim(),
        email,
        phone,
        password,
      });

      Alert.alert("Амжилттай", "Бүртгэл амжилттай боллоо");
      setMode("login");
      // Clear form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setOrganization("");
    } catch (err) {
      const errorMsg = formatApiHttpError(err);
      Alert.alert("Алдаа", errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.background} />

      <View style={styles.card}>
        <Text style={styles.brand}>Яаралтай тусламж</Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabButton, mode === "login" && styles.tabButtonActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
              Нэвтрэх
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, mode === "register" && styles.tabButtonActive]}
            onPress={() => setMode("register")}
          >
            <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
              Бүртгүүлэх
            </Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Үргэлжлүүлэхийн тулд нэвтэрнэ үү"
            : "Шинэ хэрэглэгчийн мэдээллээ бөглөнө үү"}
        </Text>

        {/* LOGIN */}
        {mode === "login" ? (
          <>
            <TextInput
              placeholder="И-мэйл"
              placeholderTextColor="#9CA3AF"
              value={loginName}
              onChangeText={setLoginName}
              style={styles.input}
            />

            <TextInput
              placeholder="Нууц үг"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </>
        ) : (
          <>
            {/* REGISTER */}
            <View style={styles.nameRow}>
              <TextInput
                placeholder="Овог"
                placeholderTextColor="#9CA3AF"
                value={lastName}
                onChangeText={setLastName}
                style={[styles.input, styles.halfInput]}
              />

              <TextInput
                placeholder="Нэр"
                placeholderTextColor="#9CA3AF"
                value={firstName}
                onChangeText={setFirstName}
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              placeholder="И-мэйл"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />

            <TextInput
              placeholder="Утас"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
            />

            <TextInput
              placeholder="Хаяг"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />

            <TextInput
              placeholder="Байгууллага"
              placeholderTextColor="#9CA3AF"
              value={organization}
              onChangeText={setOrganization}
              style={styles.input}
            />

            <TextInput
              placeholder="Нууц үг"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </>
        )}

        {/* BUTTON */}
        <Pressable
          style={styles.button}
          onPress={mode === "login" ? handleLogin : handleRegister}
        >
          <Text style={styles.buttonText}>
            {mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}
          </Text>
        </Pressable>

        <Text style={styles.footer}>© 2026 Emergency System</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#5B7CFF",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 30,
    elevation: 12,
  },
  brand: {
    alignSelf: "center",
    color: "#4338CA",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    marginBottom: 20,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#4338CA",
  },
  tabText: {
    color: "#4B5563",
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    color: "#111827",
  },
  button: {
    width: "100%",
    backgroundColor: "#4338CA",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
  },
});