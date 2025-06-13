import React, { useState } from "react"

import "./options.css"

function OptionsIndex() {
  const [chunkDuration, setChunkDuration] = useState(120)
  const [workDuration, setWorkDuration] = useState(25)
  const [shortBreakDuration, setShortBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)

  const handleSave = () => {
    // Save settings to chrome.storage.local
    console.log("Settings saved")
  }

  return (
    <div className="options-container">
      <h1>チャンクポモドーロセッター - 設定</h1>
      
      <div className="settings-section">
        <h2>チャンク設定</h2>
        <div className="setting-item">
          <label htmlFor="chunk-duration">チャンク時間 (分)</label>
          <input
            id="chunk-duration"
            type="number"
            min="30"
            max="240"
            value={chunkDuration}
            onChange={(e) => setChunkDuration(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>ポモドーロ設定</h2>
        <div className="setting-item">
          <label htmlFor="work-duration">作業時間 (分)</label>
          <input
            id="work-duration"
            type="number"
            min="15"
            max="60"
            value={workDuration}
            onChange={(e) => setWorkDuration(parseInt(e.target.value))}
          />
        </div>
        <div className="setting-item">
          <label htmlFor="short-break">短い休憩 (分)</label>
          <input
            id="short-break"
            type="number"
            min="3"
            max="15"
            value={shortBreakDuration}
            onChange={(e) => setShortBreakDuration(parseInt(e.target.value))}
          />
        </div>
        <div className="setting-item">
          <label htmlFor="long-break">長い休憩 (分)</label>
          <input
            id="long-break"
            type="number"
            min="10"
            max="30"
            value={longBreakDuration}
            onChange={(e) => setLongBreakDuration(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={handleSave}>
          設定を保存
        </button>
      </div>
    </div>
  )
}

export default OptionsIndex