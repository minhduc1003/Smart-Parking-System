import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const DepositScreen = () => {
  const [amount, setAmount] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const router = useRouter();

  const handleDeposit = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setMessage("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      // Replace with your actual deposit API call
      // await depositFunds(parseFloat(amount));
      setMessage("Deposit successful!");
      setAmount("");
    } catch (error) {
      setMessage("Failed to process deposit");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#047857" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Deposit Funds</Text>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>$250.00</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter deposit amount"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {message ? (
          <View
            style={[
              styles.messageContainer,
              message.includes("successful")
                ? styles.successContainer
                : styles.errorContainer,
            ]}
          >
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleDeposit}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {loading ? "Processing..." : "Deposit Now"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F7FA",
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  backText: {
    color: "#047857",
    fontSize: 16,
    marginLeft: 5,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 30,
    textAlign: "center",
  },
  balanceContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 16,
    color: "#555555",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#047857",
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: "#555555",
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D0D7DE",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  currencySymbol: {
    paddingHorizontal: 15,
    fontSize: 18,
    color: "#555555",
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 18,
    color: "#333333",
  },
  messageContainer: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: "center",
  },
  successContainer: {
    backgroundColor: "#E7F9ED",
  },
  errorContainer: {
    backgroundColor: "#FEE7EA",
  },
  messageText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
  },
  button: {
    backgroundColor: "#047857",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#047857",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#A5B4FC",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});

export default DepositScreen;
