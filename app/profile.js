import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image
} from "react-native";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Буцах</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Профайл</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* PROFILE IMAGE */}
      <View style={styles.profilePreview}>
        <Image
          source={require("./image/nami.png")}
          style={styles.profileAvatar}
        />

        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>✏️</Text>
        </View>
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Хувийн мэдээлэл</Text>
          <Pressable style={styles.cardAction}>
            <Text style={styles.cardActionText}>Засах</Text>
          </Pressable>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.icon}>👤</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Нэр</Text>
            <Text style={styles.infoValue}>Namsrai</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.icon}>✉️</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>И-мэйл</Text>
            <Text style={styles.infoValue}>namsrai@gmail.com</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.icon}>📞</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Утас</Text>
            <Text style={styles.infoValue}>85457340</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.icon}>🏠</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Хаяг</Text>
            <Text style={styles.infoValue}>
              Ulaanbaatar, Mongolia
            </Text>
          </View>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FF",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backButton: {
    width: 100,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0B1A51",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  backText: {
    color: "#1F57FF",
    fontWeight: "800",
    fontSize: 20,
  },
  headerTitle: {
    
    fontSize: 18,
    fontWeight: "800",
    color: "#0F1C44",
  },
  headerSpacer: {
    width: 44,
  },
  profilePreview: {
    alignItems: "center",
    marginBottom: 28,
  },
  profileAvatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#EEF3FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#FFFFFF",
    shadowColor: "#0B1A51",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },
  avatarText: {
    
    fontSize: 42,
    fontWeight: "800",
    color: "#1F57FF",
  },
  editBadge: {
    
    position: "absolute",
    right: 28,
    bottom: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0B1A51",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  editBadgeText: {
    
    fontSize: 18,
    color: "#1F57FF",
  },
  /* PROFILE */
  profilePreview: {
    alignItems: "center",
    marginBottom: 25,
  },

  profileAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 120,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
  },

  editBadgeText: {
    fontSize: 16,
  },
  card: {
    
    backgroundColor: "#FFFFFF",
    width: "90%",
    alignSelf: "center",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#0B1A51",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F1C44",
  },
  cardAction: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#EFF3FF",
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F57FF",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  icon: {
    fontSize: 20,
    marginRight: 16,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    color: "#6D7B9A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  infoValue: {
    color: "#0F1C44",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5FF",
    marginHorizontal: -22,
  },
});
