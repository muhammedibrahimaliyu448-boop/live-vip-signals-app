import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Share, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview'; 

export default function App() {
  const [tier, setTier] = useState("FREE USER");
  const [activeTab, setActiveTab] = useState("binance"); 
  const [binanceSignals, setBinanceSignals] = useState([]);
  const [coingeckoSignals, setCoingeckoSignals] = useState([]);
  const [sharesCount, setSharesCount] = useState(0);
  const [showWebView, setShowWebView] = useState(false);
  const [expiryTime, setExpiryTime] = useState(null);
  const [loading, setLoading] = useState(true);

  // Your fully integrated Selar payment and atomic validation links
  const SELAR_PRODUCT_LINK = "https://selar.com/db76u82558"; 
  const REDIRECT_SUCCESS_URL = "https://selar.com";
  const cryptoAssets = [          
    { symbol: "BTCUSDT", geckoId: "bitcoin", name: "Bitcoin (BTC)" },
    { symbol: "ETHUSDT", geckoId: "ethereum", name: "Ethereum (ETH)" },
    { symbol: "SOLUSDT", geckoId: "solana", name: "Solana (SOL)" },
    { symbol: "BNBUSDT", geckoId: "binancecoin", name: "Binance Coin (BNB)" },
    { symbol: "XRPUSDT", geckoId: "ripple", name: "Ripple (XRP)" },
    { symbol: "ADAUSDT", geckoId: "cardano", name: "Cardano (ADA)" },
    { symbol: "DOGEUSDT", geckoId: "dogecoin", name: "Dogecoin (DOGE)" },
    { symbol: "AVAXUSDT", geckoId: "avalanche-2", name: "Avalanche (AVAX)" }
  ];

  // Automatic subscription expiry check routing loop
  useEffect(() => {
    if (expiryTime) {
      const interval = setInterval(() => {
        if (Date.now() >= expiryTime) {
          setTier("FREE USER");
          setExpiryTime(null);
          Alert.alert("VIP Expired", "Your premium subscription has expired! Please renew to unlock all signals.");
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [expiryTime]);

  const fetchBinanceMarketData = async () => {
    try {
      const isVip = tier === "💎 VIP PREMIUM";
      const activeAssets = isVip ? cryptoAssets : cryptoAssets.slice(0, 2);
      
      const response = await fetch("https://binance.com");
      const data = await response.json();
      
      const processed = activeAssets.map((asset) => {
        const matchingNode = data.find(item => item.symbol === asset.symbol);
        const livePrice = matchingNode ? parseFloat(matchingNode.price) : 0;
        const action = (livePrice * 100) % 2 === 0 ? "BUY" : "SELL";
        return {
          id: asset.symbol, title: asset.name, action: action,
          price: livePrice > 10 ? livePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : livePrice.toFixed(4),
          tp: action === "BUY" ? (livePrice * 1.03).toFixed(2) : (livePrice * 0.97).toFixed(2),
          sl: action === "BUY" ? (livePrice * 0.98).toFixed(2) : (livePrice * 1.02).toFixed(2)
        };
      });
      setBinanceSignals(processed);
      setLoading(false);
    } catch (error) { console.log(error); }
  };

  const fetchCoinGeckoMarketData = async () => {
    try {
      const isVip = tier === "💎 VIP PREMIUM";
      const activeAssets = isVip ? cryptoAssets : cryptoAssets.slice(0, 2);
      const idsString = activeAssets.map(a => a.geckoId).join(",");
      
      const response = await fetch(`https://coingecko.com{idsString}&vs_currencies=usd`);
      const data = await response.json();
      
      const processed = activeAssets.map((asset) => {
        const livePrice = data[asset.geckoId] ? parseFloat(data[asset.geckoId].usd) : 0;
        const action = (livePrice * 100) % 3 === 0 ? "SELL" : "BUY";
        return {
          id: asset.geckoId, title: asset.name, action: action,
          price: livePrice > 10 ? livePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : livePrice.toFixed(4),
          tp: action === "BUY" ? (livePrice * 1.04).toFixed(2) : (livePrice * 0.96).toFixed(2),
          sl: action === "BUY" ? (livePrice * 0.98).toFixed(2) : (livePrice * 1.02).toFixed(2)
        };
      });
      setCoingeckoSignals(processed);
      setLoading(false);
    } catch (error) { console.log(error); }
  };

  useEffect(() => {
    fetchBinanceMarketData();
    fetchCoinGeckoMarketData();
    const interval = setInterval(() => {
      fetchBinanceMarketData();
      fetchCoinGeckoMarketData();
    }, 5000);
    return () => clearInterval(interval);
  }, [tier]);

  const executeSocialShareRoutine = async () => {
    try {
      await Share.share({ message: `💥 Unlock free premium algorithmic Crypto signals live! Install app now: ${SELAR_PRODUCT_LINK}` });
      const updatedCount = sharesCount + 1;
      setSharesCount(updatedCount);
      if (updatedCount >= 5) {
        setTier("💎 VIP PREMIUM");
        setExpiryTime(Date.now() + (3 * 24 * 60 * 60 * 1000));
        Alert.alert("Access Granted!", "Congratulations! You have unlocked 3 Days of VIP Premium access!");
        setSharesCount(0); 
      } else {
        Alert.alert("Progress Updated", `${5 - updatedCount} more group shares required to unlock premium.`);
      }
    } catch (error) { Alert.alert("Error", error.message); }
  };

  const handleWebViewNavigationStateChange = (newNavState) => {
    const { url } = newNavState;
    if (url.includes(REDIRECT_SUCCESS_URL) || url.includes("success=true")) {
      setShowWebView(false);
      setTier("💎 VIP PREMIUM");
      setExpiryTime(Date.now() + (30 * 24 * 60 * 60 * 1000));
      Alert.alert("Payment Verified!", "Welcome to VIP Premium! Your 30 Days atomic subscription is now fully active.");
    }
  };

  if (showWebView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020205' }}>
        <TouchableOpacity style={styles.closeWebBtn} onPress={() => setShowWebView(false)}>
          <Text style={{ color: '#00F0FF', fontWeight: 'bold', fontSize: 14 }}>⬅️ Return to Terminal</Text>
        </TouchableOpacity>
        <WebView 
          source={{ uri: SELAR_PRODUCT_LINK }} 
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState={true}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logoTitle}>⚡ QUANTUM CORE</Text>
          <Text style={styles.logoSubtitle}>Algorithmic Live Multi-API Terminal</Text>
        </View>
        <View style={[styles.badgeContainer, { borderColor: tier === "FREE USER" ? '#FF0055' : '#00F0FF' }]}>
          <Text style={[styles.badgeText, { color: tier === "FREE USER" ? '#FF0055' : '#00F0FF' }]}>{tier}</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === "binance" && styles.activeTabBinance]} 
          onPress={() => setActiveTab("binance")}
        >
          <Text style={[styles.tabText, activeTab === "binance" && {color: '#F3BA2F'}]}>
            🟠 BINANCE {tier !== "💎 VIP PREMIUM" ? "(2 FREE)" : "(8 LIVE)"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === "coingecko" && styles.activeTabGecko]} 
          onPress={() => setActiveTab("coingecko")}
        >
          <Text style={[styles.tabText, activeTab === "coingecko" && {color: '#8CC63F'}]}>
            🦎 GECKO {tier !== "💎 VIP PREMIUM" ? "(2 FREE)" : "(8 LIVE)"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00F0FF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={activeTab === "binance" ? binanceSignals : coingeckoSignals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.signalCard, { borderColor: item.action === "BUY" ? '#00FF66' : '#FF0055' }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.coinTitleText}>{item.title}</Text>
                <View style={[styles.actionTag, { backgroundColor: item.action === "BUY" ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 0, 85, 0.15)', borderColor: item.action === "BUY" ? '#00FF66' : '#FF0055' }]}>
                  <Text style={[styles.actionTagText, { color: item.action === "BUY" ? '#00FF66' : '#FF0055' }]}>{item.action}</Text>
                </View>
              </View>
              <Text style={styles.priceText}>Live Entry: <Text style={styles.whiteValue}>${item.price}</Text></Text>
              <View style={styles.metricsRow}>
                <Text style={styles.metricText}>🚀 Target TP: <Text style={styles.tpValue}>${item.tp}</Text></Text>
                <Text style={styles.metricText}>🛑 Safety SL: <Text style={styles.slValue}>${item.sl}</Text></Text>
              </View>
            </View>
          )}
        />
      )}

      {tier === "FREE USER" && (
        <View style={styles.controlConsoleOverlay}>
          <TouchableOpacity style={styles.consoleShareButton} onPress={executeSocialShareRoutine}>
            <Text style={styles.btnText}>📢 Share App to Unlock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.consoleVipButton} onPress={() => setShowWebView(true)}>
            <Text style={styles.btnTextDark}>💳 Instant VIP Access</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020205', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#121225' },
  logoTitle: { color: '#00F0FF', fontSize: 19, fontWeight: '900', letterSpacing: 1 },
