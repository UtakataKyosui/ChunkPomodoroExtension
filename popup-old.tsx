import React, { useState, useEffect } from "react"

import "./popup.css"

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <div className="plasmo-container">
      <h1>チャンクポモドーロセッター</h1>
      <div className="timer-section">
        <div className="timer-display">
          <span className="time">25:00</span>
        </div>
        <div className="timer-controls">
          <button className="btn btn-primary">開始</button>
          <button className="btn btn-secondary">一時停止</button>
          <button className="btn btn-danger">停止</button>
        </div>
      </div>
      <div className="chunk-info">
        <h3>現在のチャンク</h3>
        <p>残り時間: 120分</p>
      </div>
    </div>
  )
}

export default IndexPopup