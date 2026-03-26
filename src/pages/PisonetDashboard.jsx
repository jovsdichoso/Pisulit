// PisonetDashboard.jsx
import React, { useEffect, useState } from 'react';
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

const PisonetDashboard = () => {
  const [latestPayment, setLatestPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [inputCode, setInputCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); 
  const [activeTimeSeconds, setActiveTimeSeconds] = useState(0); 
  const [usedPayments, setUsedPayments] = useState([]); 
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const paymentRef = ref(db, 'latest_payment');
    const unsubscribe = onValue(paymentRef, (snap) => {
      const data = snap.val();
      if (data) {
        setLatestPayment(data);
        if (data.type === "RFID" && !usedPayments.includes(data.card_id)) {
          handleRfidConnect(data);
        }
        setPaymentHistory(prev => {
          const identifier = data.type === "COIN" ? data.code : data.card_id;
          if (prev.some(p => (p.code || p.card_id) === identifier)) return prev;
          return [data, ...prev].slice(0, 5); 
        });
      }
    });
    return () => unsubscribe();
  }, [usedPayments]);

  useEffect(() => {
    let interval = null;
    if (connectionStatus === "connected" && activeTimeSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimeSeconds(prev => prev - 1);
      }, 1000);
    } else if (connectionStatus === "connected" && activeTimeSeconds <= 0) {
      setConnectionStatus("disconnected");
      setActiveTimeSeconds(0);
    }
    return () => clearInterval(interval);
  }, [connectionStatus, activeTimeSeconds]);

  const handleRfidConnect = (data) => {
    setConnectionStatus("connected");
    setActiveTimeSeconds(prev => prev + 60);
    setUsedPayments(prev => [...prev, data.card_id]);
  };

  const handleConnect = () => {
    const codeToTry = inputCode.trim().toUpperCase();
    if (usedPayments.includes(codeToTry)) {
      showTemporaryError("Code already used!");
      return;
    }
    const validVoucher = paymentHistory.find(v => v.type === "COIN" && v.code.toUpperCase() === codeToTry);
    if (validVoucher) {
      setConnectionStatus("connected");
      setActiveTimeSeconds(prev => prev + (validVoucher.minutes * 60));
      setUsedPayments(prev => [...prev, codeToTry]);
      setInputCode("");
    } else {
      showTemporaryError("Invalid Code");
    }
  };

  const showTemporaryError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📡 Pisonet-X DIY Dashboard</h1>
      <div style={styles.layout}>
        <div style={styles.panel}>
          <h2 style={{ color: '#38bdf8', marginTop: 0 }}>Machine Activity</h2>
          <div style={styles.latestBox}>
            <h3>Latest Action</h3>
            {latestPayment ? (
              <>
                <div style={styles.bigCode}>{latestPayment.type === "COIN" ? latestPayment.code : "RFID TAP"}</div>
                <p>{latestPayment.type === "COIN" ? `Voucher: ${latestPayment.minutes} Mins` : `Card ID: ${latestPayment.card_id}`}</p>
              </>
            ) : <p>Waiting for hardware signal...</p>}
          </div>
          <div style={{ marginTop: '30px' }}>
            <h3>Transaction History</h3>
            <ul style={styles.historyList}>
              {paymentHistory.map((p, i) => (
                <li key={i} style={styles.historyItem}>
                  <span>{p.type === "COIN" ? `🎫 ${p.code}` : `💳 ${p.card_id}`}</span>
                  <span style={{color: '#94a3b8'}}>{p.type === "COIN" ? `${p.minutes}m` : 'RFID'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={styles.phonePanel}>
          <div style={styles.phoneScreen}>
            <h2 style={{ color: 'white' }}>User Portal</h2>
            {connectionStatus === "connected" ? (
              <div style={styles.successScreen}>
                <div style={styles.badge}>ACTIVE</div>
                <div style={styles.clockDisplay}>{formatTime(activeTimeSeconds)}</div>
                <div style={styles.topUpSection}>
                  <input style={styles.inputSmall} placeholder="Enter Top-up Code" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} />
                  <button style={{...styles.btn, backgroundColor: '#3b82f6'}} onClick={handleConnect}>Add Time</button>
                </div>
              </div>
            ) : (
              <div style={styles.loginScreen}>
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>Tap RFID or enter code.</p>
                <input style={styles.input} placeholder="VOUCHER" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} />
                <button style={styles.btnBlue} onClick={handleConnect}>Connect</button>
                {errorMessage && <p style={{color:'#ef4444', marginTop:'10px'}}>{errorMessage}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
    container: { fontFamily: 'sans-serif', backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "20px" },
    title: { textAlign: 'center', fontSize: '2rem', marginBottom: '30px' },
    layout: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' },
    panel: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', width: '350px', border: '1px solid #334155' },
    latestBox: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid #38bdf8', textAlign: 'center' },
    bigCode: { fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', margin: '10px 0' },
    historyList: { listStyle: 'none', padding: 0 },
    historyItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' },
    phonePanel: { backgroundColor: '#000', padding: '12px', borderRadius: '35px', width: '300px', height: '550px', margin: '0 auto' },
    phoneScreen: { backgroundColor: '#1e293b', height: '100%', borderRadius: '25px', padding: '20px', display: 'flex', flexDirection: 'column' },
    loginScreen: { marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1.2rem', textAlign: 'center', marginBottom: '10px' },
    btnBlue: { width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
    successScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
    clockDisplay: { fontSize: '3.5rem', fontWeight: 'bold', margin: '20px 0' },
    badge: { backgroundColor: '#10b981', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
    topUpSection: { marginTop: 'auto', width: '100%', paddingBottom: '20px' },
    inputSmall: { width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' },
    btn: { width: '100%', padding: '10px', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }
};

export default PisonetDashboard;