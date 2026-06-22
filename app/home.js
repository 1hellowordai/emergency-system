import axios from "axios";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, FlatList, Image, Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, } from "react-native";
import MapView, { Callout, Marker, Polyline } from "react-native-maps";
import { API_BASE_URL, formatApiHttpError } from "../config/api";

const API_TIMEOUT_MS = 25000;
const TRACKING_INTERVAL_MS = 2000;

export default function Home() {
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 47.91136,
    longitude: 106.93865,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignedAmbulance, setAssignedAmbulance] = useState(null);
  const [ambulanceTracking, setAmbulanceTracking] = useState(false);
  const [arrivalStatus, setArrivalStatus] = useState('');
  const [arrivalBannerVisible, setArrivalBannerVisible] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [callTriage, setCallTriage] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  const trackingIntervalRef = useRef(null);

  const SEARCH_HISTORY_KEY = "@sos_search_history";
  const arrivalBannerTimerRef = useRef(null);
  const arrivalNotifiedRef = useRef(false);

  const sosReasons = [
    // Light calls
    { id: 1, label: "Толгой өвдөх", emoji: "🤕", category: "light" },
    { id: 2, label: "Нус гоожих", emoji: "🤮", category: "light" },
    { id: 3, label: "Ходоод өвдөх", emoji: "", category: "light" },
    { id: 4, label: "Халуурах", emoji: "🤒", category: "light" },
    { id: 5, label: "Амьсгал давчдах", emoji: "😮‍💨", category: "light" },
    { id: 6, label: "чих шуугах", emoji: "🩸", category: "light" },
    // Heavy calls
    { id: 7, label: "Ухаан алдах", emoji: "😵", category: "heavy" },
    { id: 8, label: "Осол", emoji: "🚗", category: "heavy" },
    { id: 9, label: "Амьсгал боогдох", emoji: "😤", category: "heavy" },
    { id: 10, label: "Цус алдах", emoji: "🩸", category: "heavy" },
    { id: 11, label: "Сэтгэл зүрхний өвдөлт", emoji: "💔", category: "heavy" },
    { id: 12, label: "Ноцтой гэмтэл", emoji: "🚨", category: "heavy" },
  ];

  const firstAidTips = [
    { id: 1, title: 'Цус гоожуулалт зогсоох', steps: ['Шархыг цэвэрхэн барь', 'Цэвэр алчуур/боолт ашиглан чанга бооно', 'Хэрэв боломжтой бол хөл/гараа дээш өргө'] },
    { id: 2, title: 'Амьсгал зогсох (хамар-амьсгалгүй)', steps: ['Хэн нэгэнд уриалж тусламж дуудах', 'Хэрэв мэдлэг байвал амьсгал сэргээх (CPR) эхлэх', 'Эцэст нь түргэн тусламж дууд'] },
    { id: 3, title: 'Ухаан алдах', steps: ['Хүн амьсгалж байвал биеийг хажуу тийш нь оруул', 'Өвчтөний аяыг шалгана', 'Хэрэв шаардлагатай бол түргэн тусламж дуудах'] },
    { id: 4, title: 'Тулгамдсан гэмтэл (эшн) – шархны анхны тусламж', steps: ['Шарх руу боолт тавих', 'Давхар эвхэж бэхлэх', 'Хөдөлгөөн хязгаарлах'] },
  ]

  const emergencyServiceNumbers = [
    { number: '102', label: 'Цагдаа', description: 'Зөрчил, гэмт хэрэг, замын ослын яаралтай дуудлага.' },
    { number: '103', label: 'Түргэн тусламж', description: 'Эмнэлгийн яаралтай тусламж, өвчтөний хурдан тусламж.' },
    { number: '104', label: 'Галын алба', description: 'Гал түймэр, химийн аюул, аврах ажиллагаа.' },
    { number: '105', label: 'Холбоо, мэдээлэл', description: 'Холбооны онцгой тусламж, цахилгаан холбоо тасрах тохиолдолд.' },
    { number: '106', label: 'Сэрэмжлүүлэг', description: 'Байгаль орчны аюул, ослын мэдээлэл.' },
    { number: '107', label: 'Байгаль орчин', description: 'Байгаль орчны осол, бохирдлын яаралтай дуудлага.' },
    { number: '108', label: 'Хүргэлт, тусламж', description: 'Хөдөө орон нутагт шуурхай тусламж, хүргэлтийн үйлчилгээ.' },
  ]

  const filteredReasons = sosReasons.filter(
    (reason) =>
      reason.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const loadSearchHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY)
      if (raw) {
        const stored = JSON.parse(raw)
        if (Array.isArray(stored)) {
          setSearchHistory(stored)
        }
      }
    } catch (error) {
      console.log("Search history load failed", error)
    }
  }

  const persistSearchHistory = async (history) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.log("Search history save failed", error)
    }
  }

  const addSearchHistory = (label) => {
    if (!label || !label.trim()) return
    const normalized = label.trim()
    const nextHistory = [
      normalized,
      ...searchHistory.filter((item) => item !== normalized),
    ].slice(0, 8)
    setSearchHistory(nextHistory)
    persistSearchHistory(nextHistory)
  }

  const getHistoryMatches = () => {
    if (!searchQuery.trim()) return searchHistory
    return searchHistory.filter((item) =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const findReasonByLabel = (label) =>
    sosReasons.find((reason) => reason.label === label)

  const callServiceNumber = (number) => {
    const url = `tel:${number}`
    Linking.openURL(url).catch((error) => console.log('Call failed', error))
  }

  const router = useRouter();

  // ================= LOCATION =================
  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);

    setMapRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    });
  };
  

  const openInMaps = () => {
    if (!location) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  // ================= NOTIFICATION =================
  const registerNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Анхаар", "Notification permission хэрэгтэй!");
    }
  };

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 SOS илгээгдлээ",
        body: "Таны байршил амжилттай илгээгдлээ",
      },
    });
  };

  const sendArrivalNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚑 Түргэн тусламж ирлээ",
          body: "Таны түргэн тусламжийн машин одоо таны ойролцоо ирсэн.",
        },
        trigger: { seconds: 2 },
      });
    } catch (error) {
      console.log("Arrival notification failed", error);
    }
  };

  useEffect(() => {
    getLocation();
    registerNotification();

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (arrivalBannerTimerRef.current) {
        clearTimeout(arrivalBannerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const clearActiveSOSCalls = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/emergency/active`, {
        timeout: API_TIMEOUT_MS,
      });
    } catch (error) {
      console.log("Failed to clear active SOS calls");
    }
  };

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fitMapToTracking = (ambulance, userLoc) => {
    if (!ambulance || !userLoc) return;
    const aLat = Number(ambulance.latitude);
    const aLon = Number(ambulance.longitude);
    if (!Number.isFinite(aLat) || !Number.isFinite(aLon)) return;

    const span = Math.max(
      Math.abs(aLat - userLoc.latitude),
      Math.abs(aLon - userLoc.longitude),
      0.008
    );

    setMapRegion({
      latitude: (aLat + userLoc.latitude) / 2,
      longitude: (aLon + userLoc.longitude) / 2,
      latitudeDelta: span * 2.4,
      longitudeDelta: span * 2.4,
    });
  };

  const updateArrivalStatus = async (ambulance) => {
    if (!location || !ambulance) return;
    const distKm = getDistanceKm(
      location.latitude,
      location.longitude,
      Number(ambulance.latitude),
      Number(ambulance.longitude)
    );
    setDistanceKm(distKm);
    fitMapToTracking(ambulance, location);

    if (distKm <= 0.05) {
      setArrivalStatus("Ирсэн");
      if (!arrivalNotifiedRef.current) {
        arrivalNotifiedRef.current = true;
        setArrivalBannerVisible(true);
        if (arrivalBannerTimerRef.current) {
          clearTimeout(arrivalBannerTimerRef.current);
        }
        arrivalBannerTimerRef.current = setTimeout(() => {
          setArrivalBannerVisible(false);
        }, 5000);
        await sendArrivalNotification();
      }
    } else if (distKm <= 0.25) {
      setArrivalStatus("Ирж байна");
    } else {
      setArrivalStatus("Замд байна");
    }
  };

  const fetchAssignedAmbulance = async (sosId) => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    arrivalNotifiedRef.current = false;
    setArrivalBannerVisible(false);
    setArrivalStatus("Замд байна");
    setDistanceKm(null);

    const poll = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/emergency/${sosId}`, {
          timeout: API_TIMEOUT_MS,
        });
        const sosData = response.data;

        if (sosData.CallAssignments?.length > 0) {
          const ambulance = sosData.CallAssignments[0].Ambulance;
          setAssignedAmbulance(ambulance);
          setAmbulanceTracking(true);
          await updateArrivalStatus(ambulance);
        }

        if (sosData.status === "Completed") {
          setAmbulanceTracking(false);
          if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.log("Failed to update ambulance location");
      }
    };

    await poll();
    trackingIntervalRef.current = setInterval(poll, TRACKING_INTERVAL_MS);
  };

  const fetchNearbyHospitals = async (latitude, longitude) => {
    try {
      setHospitalsLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/hospitals/nearby?latitude=${latitude}&longitude=${longitude}`,
        { timeout: API_TIMEOUT_MS }
      );
      setNearbyHospitals(response.data || []);
    } catch (error) {
      console.log("Failed to fetch nearby hospitals");
      setNearbyHospitals([]);
    } finally {
      setHospitalsLoading(false);
    }
  };

  const handleSOSPress = async (sosRequest) => {
    setSelectedSOS(sosRequest);
    await fetchNearbyHospitals(sosRequest.latitude, sosRequest.longitude);
  };

  const closeSOSDetail = () => {
    setSelectedSOS(null);
    setNearbyHospitals([]);
  };

  const handleSOSButtonPress = () => {
    if (!location) {
      Alert.alert("Байршил олдсонгүй");
      return;
    }
    setShowReasonModal(true);
    setShowDropdown(true);
  };

  const sendSOSWithReason = async (reason) => {
    setShowReasonModal(false);

    const mapReasonToPriority = (reason) => {
      if (!reason) return 'Low';
      if (reason.category === 'heavy') return 'Critical';
      return 'Low';
    };

    try {
      await clearActiveSOSCalls();

      const payload = {
        latitude: location.latitude,
        longitude: location.longitude,
        type: reason.label,
        priority: mapReasonToPriority(reason),
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/emergency`,
        payload,
        { timeout: API_TIMEOUT_MS }
      );

      try {
        await sendNotification();
      } catch (notifyErr) {
        console.log("Notification schedule failed", notifyErr);
      }

      addSearchHistory(reason.label);

      if (reason.category === 'light') {
        Alert.alert(
          "Хөнгөн ангилал",
          "Таны илгээсэн дуудлага хөнгөн ангилалд бүртгэгдлээ. Одоогоор түргэн тусламжийн баг бусад дуудлагад ажиллаж байна. Хэрэв таны биеийн байдал хүндэрвэл 103 дугаарт холбогдоно уу."
        );
      } else {
        Alert.alert("✓ SOS илгээгдлээ!", reason.label);
      }

      arrivalNotifiedRef.current = false;
      setArrivalBannerVisible(false);
      setArrivalStatus("Замд байна");
      setDistanceKm(null);
      setCallTriage(reason.category);
      setQueuePosition(null);
      setAmbulanceTracking(reason.category === 'heavy');

      const sosId = response.data.data.id;
      if (reason.category === 'heavy') {
        fetchAssignedAmbulance(sosId);

        // Check if ambulance was assigned after 4 seconds - if not, suggest calling 103
        setTimeout(async () => {
          try {
            const checkResponse = await axios.get(`${API_BASE_URL}/api/emergency/${sosId}`, {
              timeout: API_TIMEOUT_MS,
            });
            if (!checkResponse.data.CallAssignments || checkResponse.data.CallAssignments.length === 0) {
              Alert.alert(
                "⚠️ Идэвхтэй машин байхгүй",
                "Одоогоор сул түргэн тусламж байхгүй. 103 дугаарт залгана уу.",
                [
                  {
                    text: "103 дуудах",
                    onPress: () => callServiceNumber("103"),
                  },
                  { text: "Хаах", onPress: () => {} },
                ]
              );
            }
          } catch (err) {
            console.log("Ambulance check failed", err);
          }
        }, 4000);
      }
    } catch (e) {
      Alert.alert("Сервертэй холбогдохгүй байна", formatApiHttpError(e));
    }
  };

  const handleHistory = () => router.push("/history");
  const handleProfileOpen = () => router.push("/profile");
  const handleGoToLogin = () => router.push("/");

 
  const openNotifications = () => {
    Alert.alert("Notification", "Шинэ мэдэгдэл алга");
  };
  return (
    
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
                    

        <View style={styles.headerNew}>
          <View style={styles.headerTop}>
            <Pressable style={styles.loginBackButton} onPress={handleGoToLogin}>
              <Text style={styles.loginBackText}>←</Text>
            </Pressable>
            <Pressable onPress={handleProfileOpen}>
            <Image
              source={require("./image/nami.png")}
              style={styles.avatar}
            />
          </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.hello}>Сайн байна уу!</Text>
              <Text style={styles.name}>Намсрай</Text>
            </View>
            

            <Pressable style={styles.bell} onPress={openNotifications}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </Pressable>
          </View>

          <Text style={styles.mainTitle}>Таны аюулгүй байдал</Text>
          <Text style={styles.subTitle}>Танд зориулсан хамгаалалт</Text>
        </View>

        {(arrivalBannerVisible || arrivalStatus === "Ирсэн") && assignedAmbulance && (
          <View style={styles.arrivalBanner}>
            <Text style={styles.arrivalBannerText}>🚑 Түргэн тусламж таны ойролцоо ирлээ!</Text>
            <Text style={styles.arrivalBannerSubText}>
              Жолооч: {assignedAmbulance.driver_name || 'Тодорхойгүй'}
            </Text>
            <Text style={styles.arrivalBannerSubText}>
              Машин: {assignedAmbulance.plate_number || 'Тодорхойгүй'}
            </Text>
          </View>
        )}

        {/* QUICK */}
        <View style={styles.quickRow}>
          <Pressable style={styles.quickCard} onPress={handleHistory}>
            <Text style={styles.quickTitle}>Түүх</Text>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={() => setShowHelpModal(true)}>
            <Text style={styles.quickTitle}>Тусламж</Text>
          </Pressable>
        </View>

       <View style={styles.mainCard}>
          <Pressable onPress={openInMaps}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Одоогийн байршил</Text>
              <Text style={styles.cardMeta}>Газрын зураг руу очих</Text>
            </View>
          </Pressable>

          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              region={mapRegion}
              showsUserLocation
              showsMyLocationButton
              loadingEnabled
            >
              {location && (
                <Marker
                  coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                  pinColor="#1F57FF"
                >
                  <Callout tooltip={true}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>📍 Таны одоогийн байршил</Text>
                      <View style={styles.calloutRow}>
                        <Text style={styles.calloutLabel}>Өргөрөг:</Text>
                        <Text style={styles.calloutValue}>{location.latitude.toFixed(6)}</Text>
                      </View>
                      <View style={styles.calloutRow}>
                        <Text style={styles.calloutLabel}>Уртраг:</Text>
                        <Text style={styles.calloutValue}>{location.longitude.toFixed(6)}</Text>
                      </View>
                      <Text style={styles.calloutTime}>Сүүлд шинэчлэгдсэн: Одоо</Text>
                    </View>
                  </Callout>
                </Marker>
              )}
              {assignedAmbulance && ambulanceTracking && (
                <>
                  <Marker
                    coordinate={{
                      latitude: assignedAmbulance.latitude,
                      longitude: assignedAmbulance.longitude,
                    }}
                    pinColor="#ff9800"
                  >
                    <Callout tooltip={true}>
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle}>🚑 Түргэн тусламж</Text>
                        <Text style={styles.calloutValue}>
                          {assignedAmbulance.driver_name}
                        </Text>
                        <Text style={styles.calloutTime}>
                          Эмнэлэг: {assignedAmbulance.Hospital?.name || "Тодорхойгүй"}
                        </Text>
                      </View>
                    </Callout>
                  </Marker>
                  {location && (
                    <Polyline
                      coordinates={[
                        {
                          latitude: Number(assignedAmbulance.latitude),
                          longitude: Number(assignedAmbulance.longitude),
                        },
                        {
                          latitude: location.latitude,
                          longitude: location.longitude,
                        },
                      ]}
                      strokeColor="#EF4444"
                      strokeWidth={4}
                      lineDashPattern={[6, 4]}
                    />
                  )}
                </>
              )}
            </MapView>
          </View>

          {location && (
            <View style={styles.locationRow}>
              <View style={[styles.locationChip, styles.locationChipFirst]}>
                <Text style={styles.chipLabel}>Өргөрөг</Text>
                <Text style={styles.chipValue}>{location.latitude.toFixed(5)}</Text>
              </View>
              <View style={styles.locationChip}>
                <Text style={styles.chipLabel}>Уртраг</Text>
                <Text style={styles.chipValue}>{location.longitude.toFixed(5)}</Text>
              </View>
            </View>
          )}
          <Pressable style={styles.sosButton} onPress={handleSOSButtonPress}>
            <Text style={styles.sosButtonText}>🚨 SOS ИЛГЭЭХ</Text>
          </Pressable>

          {assignedAmbulance && (
            <View style={styles.sosStatusCard}>
              <Text style={styles.sosStatusCardTitle}>🚑 Түргэн тусламж хөдөлж байна</Text>
              <Text style={styles.sosStatusCardSubtitle}>Таны дуудлагад хуваарилагдсан</Text>
              <View style={styles.sosStatusInfo}>
                <View style={styles.sosStatusRow}>
                  <Text style={styles.sosStatusLabel}>Машины дугаар</Text>
                  <Text style={styles.sosStatusValue}>{assignedAmbulance.plate_number || 'Тодорхойгүй'}</Text>
                </View>
                <View style={styles.sosStatusRow}>
                  <Text style={styles.sosStatusLabel}>Жолооч</Text>
                  <Text style={styles.sosStatusValue}>{assignedAmbulance.driver_name || 'Тодорхойгүй'}</Text>
                </View>
                <View style={styles.sosStatusRow}>
                  <Text style={styles.sosStatusLabel}>Эмнэлэг</Text>
                  <Text style={styles.sosStatusValue}>{assignedAmbulance.Hospital?.name || 'Тодорхойгүй'}</Text>
                </View>
                <View style={styles.sosStatusRow}>
                  <Text style={styles.sosStatusLabel}>Статус</Text>
                  <Text style={[styles.sosStatusValue, styles.statusActive]}>
                    {arrivalStatus === 'Ирсэн' ? 'Таны гадаа ирсэн' : arrivalStatus === 'Ирж байна' ? 'Ойртож байна' : 'Замд байна'}
                  </Text>
                </View>
                {distanceKm != null && (
                  <View style={styles.sosStatusRow}>
                    <Text style={styles.sosStatusLabel}>Зай</Text>
                    <Text style={styles.sosStatusValue}>
                      {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} м` : `${distanceKm.toFixed(1)} км`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      <Modal
        visible={!!selectedSOS}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSOSDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 SOS Хүсэлтийн Мэдээлэл</Text>
              <Pressable onPress={closeSOSDetail}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSOS && (
                <>
                  <View style={styles.sosDetailCard}>
                    <Text style={styles.sosDetailLabel}>Байршил</Text>
                    <Text style={styles.sosDetailValue}>
                      📍 {selectedSOS.latitude?.toFixed(6)}, {selectedSOS.longitude?.toFixed(6)}
                    </Text>
                    <Text style={[styles.sosDetailLabel, { marginTop: 12 }]}>Статус</Text>
                    <Text style={styles.sosDetailValue}>{selectedSOS.status}</Text>
                    <Text style={[styles.sosDetailLabel, { marginTop: 12 }]}>Төлөр</Text>
                    <Text style={styles.sosDetailValue}>{selectedSOS.type}</Text>
                    <Text style={[styles.sosDetailLabel, { marginTop: 12 }]}>Цаг</Text>
                    <Text style={styles.sosDetailValue}>
                      {new Date(selectedSOS.created_at).toLocaleString('mn-MN')}
                    </Text>
                  </View>

                  <View style={styles.hospitalsSection}>
                    <Text style={styles.sectionTitle}>🏥 Ойрын Эмнэлгүүд</Text>
                    {hospitalsLoading ? (
                      <Text style={styles.loadingText}>Эмнэлгийн мэдээлэл ачаалж байна...</Text>
                    ) : nearbyHospitals.length > 0 ? (
                      <FlatList
                        data={nearbyHospitals}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                          <View style={styles.hospitalCard}>
                            <View style={styles.hospitalHeader}>
                              <Text style={styles.hospitalName}>{item.name}</Text>
                              <Text style={styles.hospitalDistance}>
                                📏 {item.distance_km} км
                              </Text>
                            </View>
                            <Text style={styles.hospitalPhone}>📞 {item.phone}</Text>
                            <Text style={styles.hospitalAddress}>📍 {item.address}</Text>
                            <Text style={styles.hospitalUnits}>
                              Идэвхтэй машин: {item.available_units}
                            </Text>
                          </View>
                        )}
                      />
                    ) : (
                      <Text style={styles.noHospitals}>Ойрын эмнэлэг олдсонгүй</Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReasonModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowReasonModal(false);
          setShowDropdown(false);
          setSearchQuery("");
          setSelectedReason(null);
        }}
      >
        <View style={styles.reasonModalOverlay}>
          <View style={styles.reasonModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.reasonModalTitle}>🚨 SOS-ын Шалтгаан</Text>
              <Text style={styles.reasonModalSubtitle}>Юуны төлөө тусламж хэрэгтэй вэ?</Text>

              <View style={styles.searchInputWrapper}>
                <TextInput
                  style={[styles.patientSearchInput, showDropdown && styles.searchInputFocused]}
                  placeholder="Ямар шалтгаанаар SOS дуулах вэ?"
                  value={selectedReason ? selectedReason.label : searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setSelectedReason(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholderTextColor="#94a3b8"
                />

                {showDropdown && (
                  <ScrollView
                    style={styles.dropdownContainer}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                  >
                    {searchQuery.trim().length === 0 && searchHistory.length > 0 && (
                      <View>
                        <Text style={styles.historyTitle}>Өмнө хайсан</Text>
                        {getHistoryMatches().map((item) => (
                          <Pressable
                            key={`history-${item}`}
                            style={styles.historyItem}
                            onPress={() => {
                              const reason = findReasonByLabel(item)
                              setSelectedReason(reason || null)
                              setSearchQuery(item)
                              setShowDropdown(false)
                            }}
                          >
                            <Text style={styles.historyItemText}>{item}</Text>
                          </Pressable>
                        ))}
                        <View style={styles.historyDivider} />
                      </View>
                    )}
                    {(searchQuery.trim().length > 0 ? filteredReasons : sosReasons).map(
                      (reason) => (
                        <Pressable
                          key={reason.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedReason(reason);
                            setSearchQuery(reason.label);
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemEmoji}>{reason.emoji}</Text>
                          <View style={styles.dropdownItemContent}>
                            <Text style={styles.dropdownItemLabel}>{reason.label}</Text>
                          </View>
                        </Pressable>
                      )
                    )}
                    {searchQuery.trim().length > 0 && filteredReasons.length === 0 && (
                      <Text style={styles.dropdownEmpty}>Тохирох шалтгаан олдсонгүй.</Text>
                    )}
                  </ScrollView>
                )}
              </View>

              {selectedReason ? (
                <View style={styles.selectedReasonCard}>
                  <Text style={styles.selectedReasonEmoji}>{selectedReason.emoji}</Text>
                  <View style={styles.selectedReasonContent}>
                    <Text style={styles.selectedReasonLabel}>Сонгосон шалтгаан</Text>
                    <Text style={styles.selectedReasonValue}>{selectedReason.label}</Text>
                  </View>
                </View>
              ) : null}

              <View style={{ height: 16 }} />
            </ScrollView>
            <View style={styles.reasonModalActions}>
              <Pressable
                style={[
                  styles.reasonCancelButton,
                  selectedReason && styles.reasonSendButton,
                ]}
                onPress={() => {
                  if (selectedReason) {
                    sendSOSWithReason(selectedReason);
                  } else {
                    setShowReasonModal(false);
                    setShowDropdown(false);
                    setSearchQuery("");
                  }
                }}
              >
                <Text
                  style={[
                    styles.reasonCancelText,
                    selectedReason && styles.reasonSendText,
                  ]}
                >
                  {selectedReason ? "SOS илгээх" : "Цуцлах"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>


      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.reasonModalOverlay}>
          <View style={[styles.reasonModalContent, { maxHeight: '80%' }] }>
            <Text style={styles.reasonModalTitle}>🩺 Яаралтай утас</Text>
            <ScrollView style={{ marginTop: 12 }}>
              <View style={{ marginTop: 0 }}>
                <Text style={{ fontWeight: '800', fontSize: 15, marginBottom: 10 }}>102-108 яаралтай утас</Text>
                {emergencyServiceNumbers.map((item) => (
                  <View key={item.number} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700' }}>{item.number} - {item.label}</Text>
                    <Text style={{ color: '#4b5563', marginTop: 2 }}>{item.description}</Text>
                    <Pressable style={styles.callButton} onPress={() => callServiceNumber(item.number)}>
                      <Text style={styles.callButtonText}>Дуудах {item.number}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>

            <Pressable style={styles.reasonCancelButton} onPress={() => setShowHelpModal(false)}>
              <Text style={styles.reasonCancelText}>Хаах</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDF4FF" },
  contentContainer: { padding: 20 },

  headerNew: { marginBottom: 25 },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
  },

  headerText: {
    flex: 1,
    marginLeft: 10,
  },

  hello: { color: "#888", fontSize: 13 },
  name: { fontSize: 16, fontWeight: "700" },

  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  loginBackButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },

  loginBackText: {
    fontSize: 20,
    color: "#1F57FF",
    fontWeight: "700",
  },

  mainTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
  },

  subTitle: {
    fontSize: 15,
    color: "#666",
  },

  quickRow: {
    flexDirection: "row",
    marginBottom: 20,
  },

  quickCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginRight: 10,
    alignItems: "center",
  },
cardMeta: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  quickTitle: {
    fontWeight: "700",
  },

  mainCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    borderRadius: 32,
    padding: 22,
    marginBottom: 32,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 19.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardMeta: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  mapWrapper: {
    width: "100%",
    height: 280,
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 22,
  },
  map: {
    width: "100%",
    height: "100%",
  },

  locationRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 26,
  },
  locationChip: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingVertical: 17,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipLabel: {
    color: "#64748B",
    fontSize: 12.5,
    marginBottom: 6,
  },
  chipValue: {
    color: "#0F172A",
    fontSize: 16.5,
    fontWeight: "700",
  },

  activeSOSCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  activeSOSTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 8,
  },
  activeSOSText: {
    fontSize: 14,
    color: "#92400E",
    marginBottom: 4,
  },
  sosStatusCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  sosStatusCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F57FF",
    marginBottom: 4,
  },
  sosStatusCardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 14,
  },
  sosStatusInfo: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
  },
  sosStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sosStatusLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  sosStatusValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
    textAlign: "right",
  },
  calloutContainer: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxWidth: 220,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
    color: "#111827",
  },
  calloutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  calloutLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  calloutValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "700",
  },
  calloutTime: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },

  sosButton: {
    backgroundColor: "#EF4444",
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 10,
  },
  sosButtonText: {
    color: "#FFFFFF",
    fontSize: 17.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  bottom: {
    marginTop: 30,
    alignItems: "center",
  },

  profileBtn: {
    backgroundColor: "#1F57FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  white: {
    color: "#fff",
    fontWeight: "bold",
  },

  backBtn: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 10,
  },

  sosListContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  sosListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sosListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sosListRefresh: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F57FF",
  },
  sosListEmpty: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 16,
  },
  sosRequestCardTracked: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#93C5FD",
  },

  sosRequestCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },

  sosRequestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sosRequestType: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
  },

  sosRequestStatus: {
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  sosRequestInfo: {
    gap: 6,
  },

  sosRequestCoords: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },

  sosRequestTime: {
    fontSize: 12,
    color: "#94A3B8",
  },

  sosRequestTap: {
    fontSize: 12,
    color: "#0F57FF",
    fontWeight: "600",
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingTop: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  closeBtn: {
    fontSize: 24,
    color: "#94A3B8",
    fontWeight: "600",
  },
  closeBtnSmall: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "700",
  },

  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  sosDetailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  sosDetailLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 12,
  },

  sosDetailValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    marginTop: 4,
  },

  hospitalsSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  hospitalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  hospitalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  hospitalName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },

  hospitalDistance: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F57FF",
    backgroundColor: "#EDF4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  hospitalPhone: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 6,
  },

  hospitalAddress: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 6,
  },

  hospitalUnits: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },

  loadingText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 20,
  },

  noHospitals: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 20,
  },

  reasonModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  reasonModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: "90%",
    maxWidth: 420,
    maxHeight: '85%',
  },

  reasonModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center",
  },

  reasonModalSubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },

  reasonsList: {
    marginTop: 0,
    marginBottom: 0,
    display: "none",
  },

  reasonButton: {
    display: "none",
  },

  patientBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },

  patientBadgeText: {
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },

  patientBadgeSmall: {
    color: "#475569",
    fontSize: 13,
  },

  patientSearchInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    marginVertical: 20,
    fontSize: 15,
  },

  patientRow: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  patientRowTitle: {
    fontWeight: "700",
    color: "#0F172A",
  },

  patientRowSubtitle: {
    color: "#64748B",
    marginTop: 2,
  },

  patientRowInfo: {
    color: "#475569",
    marginTop: 6,
  },

  serviceNumbersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    justifyContent: "center",
  },

  serviceButton: {
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    margin: 6,
  },

  serviceButtonActive: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },

  serviceNumberText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1D4ED8",
  },

  serviceLabelText: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
    textAlign: "center",
  },

  callButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#0F72C3",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  callButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  reasonEmoji: {
    fontSize: 24,
    marginRight: 12,
  },

  reasonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
  },

  reasonCancelButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  reasonCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },

  reasonSendButton: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },

  reasonSendText: {
    color: "#FFFFFF",
  },

  reasonModalActions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  searchInputWrapper: {
    position: "relative",
    marginVertical: 20,
  },

  searchInputFocused: {
    borderColor: "#1F57FF",
    borderWidth: 2,
  },

  dropdownContainer: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
    maxHeight: 360,
    zIndex: 1000,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 6,
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  dropdownItemEmoji: {
    fontSize: 22,
    marginRight: 12,
  },

  dropdownItemContent: {
    flex: 1,
  },

  dropdownItemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  historyTitle: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  historyItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  historyItemText: {
    fontSize: 15,
    color: "#0F172A",
  },

  historyDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 6,
  },

  dropdownEmpty: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },

  selectedReasonCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#0F57FF",
  },

  selectedReasonEmoji: {
    fontSize: 32,
    marginRight: 14,
  },

  selectedReasonContent: {
    flex: 1,
  },

  selectedReasonLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },

  selectedReasonValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Ambulance Tracking Styles
  trackingCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },

  trackingHeader: {
    alignItems: "center",
    marginBottom: 15,
  },

  trackingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F57FF",
    marginBottom: 5,
  },

  trackingSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },

  trackingInfo: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },

  trackingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  trackingLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  trackingValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
  },

  statusActive: {
    color: "#10B981",
  },

  routeButton: {
    backgroundColor: "#1F57FF",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },

  routeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  trackingNote: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
  },

  arrivalInfo: {
    fontSize: 15,
    color: "#111827",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 16,
  },
  arrivalBanner: {
    backgroundColor: "#DCFCE7",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#22C55E",
    alignItems: "center",
  },

  arrivalBannerText: {
    color: "#166534",
    fontSize: 15,
    fontWeight: "700",
  },
  arrivalBannerSubText: {
    color: "#166534",
    fontSize: 14,
    marginTop: 2,
  },

  triageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  triageBadgeLight: {
    backgroundColor: "#FCD34D",
  },

  triageBadgeHeavy: {
    backgroundColor: "#EF4444",
  },

  triageBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  triageBadgeTextLight: {
    color: "#92400E",
  },

  triageBadgeTextHeavy: {
    color: "#FFFFFF",
  },

  queueStatusText: {
    fontSize: 13,
    color: "#F59E0B",
    fontWeight: "600",
    marginTop: 4,
  },
});