import React, { useState, useEffect, useRef } from 'react';

const SettingsPage = () => {
  const [activeTimeSeconds, setActiveTimeSeconds] = useState(0);
  const [pesosBalance, setPesosBalance] = useState(0);
  const [espIp, setEspIp] = useState("10.74.201.21");
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [windowCountdown, setWindowCountdown] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sessionCoins, setSessionCoins] = useState(0);

  const startedWithZero = useRef(false);

  // Helper to calculate minutes from session coins
  const totalPendingMinutes = sessionCoins * 2;

  const openInsertCoin = async () => {
    try {
      await fetch(`http://${espIp}/toggle?state=true`);
      startedWithZero.current = activeTimeSeconds === 0;
      setSessionCoins(0);
      setIsSystemActive(true);
      setWindowCountdown(15);
      setShowModal(true);
    } catch (err) {
      alert("ESP32 Offline!");
    }
  };

  const closeInsertCoin = async () => {
    try {
      await fetch(`http://${espIp}/toggle?state=false`);
      
      if (startedWithZero.current && sessionCoins > 0) {
        // Convert session coins to seconds (1 coin = 120 seconds)
        setActiveTimeSeconds(sessionCoins * 120);
      }

      setIsSystemActive(false);
      setWindowCountdown(0);
      setShowModal(false);
      setSessionCoins(0);
    } catch (err) {
      console.error("Lock error:", err);
    }
  };

  useEffect(() => {
    let timer = null;
    if (showModal && windowCountdown > 0) {
      timer = setInterval(() => setWindowCountdown(prev => prev - 1), 1000);
    } else if (showModal && windowCountdown === 0) {
      closeInsertCoin();
    }
    return () => clearInterval(timer);
  }, [windowCountdown, showModal]);

  useEffect(() => {
    const checkEsp32 = async () => {
      if (!isSystemActive) return;
      try {
        const response = await fetch(`http://${espIp}/status`);
        const data = await response.json();

        if (data.newScan) {
          setSessionCoins(prev => prev + 1);
          if (!startedWithZero.current) {
            setPesosBalance(prev => prev + 1);
          }
          setWindowCountdown(15); 
        }
      } catch (err) { }
    };
    let interval = isSystemActive ? setInterval(checkEsp32, 1000) : null;
    return () => clearInterval(interval);
  }, [isSystemActive, espIp]);

  useEffect(() => {
    let timer = null;
    if (!isPaused && activeTimeSeconds > 0) {
      timer = setInterval(() => {
        setActiveTimeSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, activeTimeSeconds]);

  const handleExtend = () => {
    if (pesosBalance >= 1) {
      setPesosBalance(prev => prev - 1);
      setActiveTimeSeconds(prev => prev + 120);
    } else {
      alert("Insufficient Balance!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.label}>Pisulit</div>
          <div style={styles.balanceBadge}>Bank: ₱ {pesosBalance.toFixed(2)}</div>
        </div>

        <div style={styles.timerContainer}>
          <h1 style={{...styles.clock, color: isPaused ? "#94a3b8" : (activeTimeSeconds > 0 ? "#38bdf8" : "#ef4444")}}>
            {Math.floor(activeTimeSeconds / 60)}:{(activeTimeSeconds % 60).toString().padStart(2, '0')}
          </h1>
          <p style={{margin:0, color:'#94a3b8', fontSize:'0.8rem', fontWeight: 'bold'}}>
             {activeTimeSeconds > 0 ? (isPaused ? "PAUSED" : "ACTIVE") : "READY"}
          </p>
        </div>

        <div style={styles.buttonGrid}>
          <button onClick={openInsertCoin} style={{...styles.btn, backgroundColor: "#10b981"}}>Insert Coin</button>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            disabled={activeTimeSeconds === 0}
            style={{...styles.btn, backgroundColor: activeTimeSeconds === 0 ? "#334155" : (isPaused ? "#10b981" : "#f59e0b")}}
          >
            {isPaused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
          <button 
            onClick={handleExtend} 
            disabled={pesosBalance < 1}
            style={{...styles.btn, backgroundColor: pesosBalance < 1 ? "#334155" : "#3b82f6"}}
          >
            Extend
          </button>
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{marginTop:0}}>Coin Slot Active</h3>
            
            <div style={styles.sessionCounter}>
              <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>🪙 x {sessionCoins}</div>
              
              {/* --- NEW CONVERSION DISPLAY --- */}
              <div style={styles.conversionText}>
                {startedWithZero.current ? (
                  <span style={{color: '#38bdf8'}}>+ {totalPendingMinutes} Minutes Time</span>
                ) : (
                  <span style={{color: '#10b981'}}>+ ₱ {sessionCoins.toFixed(2)} Bank</span>
                )}
              </div>
            </div>

            <div style={styles.progressContainer}>
              <div style={{
                ...styles.progressBar, 
                width: `${(windowCountdown / 15) * 100}%`,
                transition: windowCountdown === 15 ? 'none' : 'width 1s linear'
              }}></div>
            </div>
            
            <p style={{fontSize: '0.9rem'}}>Window: <b>{windowCountdown}s</b></p>
            <button onClick={closeInsertCoin} style={styles.closeBtn}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { fontFamily: 'sans-serif', backgroundColor: "#0f172a", color: "white", minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' },
  panel: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '25px', textAlign: 'center', width: '360px', border: '1px solid #334155' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  label: { fontWeight: 'bold', color: '#38bdf8' },
  balanceBadge: { backgroundColor: '#0f172a', padding: '8px 15px', borderRadius: '20px', color: '#10b981', fontWeight: 'bold', border: '1px solid #10b981' },
  timerContainer: { backgroundColor: '#0f172a', padding: '25px', borderRadius: '15px', marginBottom: '25px' },
  clock: { fontSize: '5rem', margin: '0', fontWeight: 'bold', fontFamily: 'monospace' },
  buttonGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  btn: { padding: '16px', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { backgroundColor: '#1e293b', padding: '40px', borderRadius: '30px', width: '300px', textAlign: 'center', border: '1px solid #38bdf8' },
  sessionCounter: { backgroundColor: '#0f172a', padding: '20px', borderRadius: '20px', marginBottom: '20px' },
  conversionText: { marginTop: '10px', fontSize: '1rem', fontWeight: 'bold' },
  progressContainer: { width: '100%', height: '12px', backgroundColor: '#334155', borderRadius: '6px', margin: '20px 0', overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#10b981' },
  closeBtn: { marginTop: '10px', padding: '12px 25px', backgroundColor: '#ef4444', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 'bold' }
};

export default SettingsPage;