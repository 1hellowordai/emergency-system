import { SafeAreaView, View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config/api";

const fallbackHistory = [
  {
    patient: "Жавхлан Б.",
    event: "Зүрхний давчдах мэдрэгдсэн",
    date: "2026-03-29 14:12",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
  },
  {
    patient: "Жавхлан Б.",
    event: "Зүрхний давчдах мэдрэгдсэн",
    date: "2026-03-28 09:45",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
  },
  {
    patient: "Жавхлан Б.",
    event: "Толгой өвдөх, дотор муухайрах",
    date: "2026-03-27 18:30",
    location: "Баянзүрх дүүрэг, Улаанбаатар",
  },
];

export default function History() {
  const [data, setData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const router = useRouter();

  const handleGoBack = () => {
    router.push("/home");
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/emergency`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setData(res.data);
        } else {
          setData(fallbackHistory);
        }
      })
      .catch(() => {
        setError("Өмнөх түүхийг татахад алдаа гарлаа.");
        setData(fallbackHistory);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Back Button - Зурагтай яг ижил хэлбэртэй */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </View>

      <Text style={styles.heading}>Өмнөх түүхүүд</Text>
      <Text style={styles.subheading}>SOS илгээмжийн түүх</Text>

      {selectedPatient && (
        <View style={styles.detailPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Сонгосон өвчтөн</Text>
            <Pressable onPress={() => setSelectedPatient(null)} style={styles.panelClose}>
              <Text style={styles.panelCloseText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.panelName}>
            {selectedPatient.patient || selectedPatient.name || "Нэргүй"}
          </Text>

          <View style={styles.panelInfo}>
            <Text style={styles.panelField}>
              <Text style={styles.panelFieldLabel}>Огноо: </Text>
              {selectedPatient.date || selectedPatient.created_at || selectedPatient.createdAt || "Тодорхойгүй"}
            </Text>
            <Text style={styles.panelField}>
              <Text style={styles.panelFieldLabel}>Үйл явдал: </Text>
              {selectedPatient.event || selectedPatient.description || selectedPatient.type || "Мэдээлэл байхгүй"}
            </Text>
            <Text style={styles.panelField}>
              <Text style={styles.panelFieldLabel}>Байршил: </Text>
              {selectedPatient.location || 
                (selectedPatient.latitude && selectedPatient.longitude 
                  ? `${selectedPatient.latitude.toFixed(5)}, ${selectedPatient.longitude.toFixed(5)}` 
                  : "--")}
            </Text>
            {selectedPatient.phone && (
              <Text style={styles.panelField}>
                <Text style={styles.panelFieldLabel}>Утас: </Text>
                {selectedPatient.phone}
              </Text>
            )}
          </View>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading && <Text style={styles.loadingText}>Түр хүлээнэ үү...</Text>}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {data.map((item, index) => {
          const patientName = item.patient || item.name || "Нэргүй бүртгэл";
          const eventText = item.event || item.description || item.type || "Өмнөх илгээмж";
          const dateText = item.date || item.created_at || item.createdAt || "Огноо тодорхойгүй";
          const locationText = item.location || 
            (item.latitude && item.longitude 
              ? `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}` 
              : "Байршил алга");

          return (
            <Pressable
              key={`${index}-${patientName}`}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => setSelectedPatient(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{patientName}</Text>
                <Text style={styles.cardDate}>{dateText}</Text>
              </View>
              <Text style={styles.cardEvent}>{eventText}</Text>
              <Text style={styles.cardLocation}>📍 {locationText}</Text>
            </Pressable>
          );
        })}

        {data.length === 0 && !loading && (
          <Text style={styles.emptyText}>Одоогоор түүх байхгүй байна.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDF4FF",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },

  /* Back Button - Яг зурагтай ижил */
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },

  backIcon: {
    fontSize: 22,
    color: "#1F57FF",
    fontWeight: "600",
    lineHeight: 24,
  },

  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    paddingHorizontal: 20,
    marginBottom: 4,
  },

  subheading: {
    fontSize: 15,
    color: "#64748B",
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  errorText: {
    color: "#EF4444",
    fontSize: 15,
    textAlign: "center",
    marginVertical: 12,
    paddingHorizontal: 20,
  },

  loadingText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginVertical: 20,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardDate: {
    fontSize: 12.5,
    color: "#94A3B8",
    fontWeight: "600",
  },
  cardEvent: {
    fontSize: 15.5,
    color: "#334155",
    lineHeight: 22,
    marginBottom: 10,
  },
  cardLocation: {
    fontSize: 13.5,
    color: "#64748B",
  },

  detailPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 22,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  panelClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  panelCloseText: {
    fontSize: 22,
    color: "#64748B",
    fontWeight: "600",
  },
  panelName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  panelInfo: {
    gap: 12,
  },
  panelField: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  panelFieldLabel: {
    fontWeight: "700",
    color: "#0F172A",
  },

  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 15,
    marginTop: 40,
  },
});