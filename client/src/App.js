import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io();

export default function App() {
  const [email, setEmail] = useState("");
  const [logged, setLogged] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [prices, setPrices] = useState({});
  const [subs, setSubs] = useState(new Set());

  useEffect(() => {
    fetch("/api/stocks").then(r => r.json()).then(setStocks);
    fetch("/api/prices").then(r => r.json()).then(setPrices);

    socket.on("price", ({ ticker, price }) => {
      setPrices(p => ({ ...p, [ticker]: price }));
    });

    return () => socket.off("price");
  }, []);

  const toggle = t => {
    const copy = new Set(subs);
    if (copy.has(t)) {
      socket.emit("unsubscribe", t);
      copy.delete(t);
    } else {
      socket.emit("subscribe", t);
      copy.add(t);
    }
    setSubs(copy);
  };

  if (!logged) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Stock Dashboard</h2>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <button onClick={() => { socket.emit("login", email); setLogged(true); }}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {email}</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr><th>Ticker</th><th>Price</th><th>Action</th></tr>
        </thead>
        <tbody>
          {stocks.map(t => (
            <tr key={t}>
              <td>{t}</td>
              <td>{prices[t]}</td>
              <td>
                <button onClick={() => toggle(t)}>
                  {subs.has(t) ? "Unsubscribe" : "Subscribe"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Your Subscriptions</h3>
      <ul>
        {[...subs].map(s => (
          <li key={s}>{s}: {prices[s]}</li>
        ))}
      </ul>
    </div>
  );
}
