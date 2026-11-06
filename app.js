import { GoogleGenAI } from "@google/genai";

const subjects = [
  { eng: "I", ch: "我", pluralEng: "We", pluralCh: "我们" },
  { eng: "You", ch: "你", pluralEng: "You all", pluralCh: "你们" },
  { eng: "He", ch: "他", pluralEng: "They (men)", pluralCh: "他们" },
  { eng: "She", ch: "她", pluralEng: "They (women)", pluralCh: "她们" }
];

const identities = [
  { eng: "teacher", ch: "老师" },
  { eng: "classmate", ch: "同学" },
  { eng: "friend", ch: "朋友" }
];

const languages = [
  { eng: "English", ch: "英语" },
  { eng: "French", ch: "法语" },
  { eng: "Chinese", ch: "中文" }
];

let currentTarget = { english: "", chinese: "" };
let localStream = null;
let capturedImageBase64 = null;

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomSentence() {
  const sub = getRandomElement(subjects);
  const isPlural = Math.random() > 0.5;
  const subEng = isPlural ? sub.pluralEng : sub.eng;
  const subCh = isPlural ? sub.pluralCh : sub.ch;
  const patternType = Math.floor(Math.random() * 5); 
  let eng = "";
  let ch = "";

  switch(patternType) {
    case 0:
      const id = getRandomElement(identities);
      const isNegative = Math.random() > 0.5;
      const isQuestion = !isNegative && Math.random() > 0.5;
      if (isNegative) {
        eng = `${subEng} are not ${id.eng}s.`;
        ch = `${subCh}不是${id.ch}`;
      } else if (isQuestion) {
        eng = `Is ${subEng.toLowerCase()} a ${id.eng}?`;
        ch = `${subCh}是${id.ch}吗`;
      } else {
        eng = `${subEng} ${isPlural ? 'are' : 'is'} a ${id.eng}.`;
        ch = `${subCh}是${id.ch}`;
      }
      break;
    case 1:
      const lang = getRandomElement(languages);
      const usesAll = isPlural && Math.random() > 0.5;
      const languageQuestion = Math.random() > 0.5;
      if (languageQuestion) {
        eng = `Does ${subEng.toLowerCase()} study ${lang.eng}?`;
        ch = `${subCh}学${lang.ch}吗`;
      } else if (usesAll) {
        eng = `${subEng} all study ${lang.eng}.`;
        ch = `${subCh}都学${lang.ch}`;
      } else {
        eng = `${subEng} study ${lang.eng}.`;
        ch = `${subCh}学${lang.ch}`;
      }
      break;
    case 2:
      const hasFriends = Math.random() > 0.5;
      const possessionQuestion = Math.random() > 0.5;
      if (possessionQuestion) {
        eng = `Do ${subEng.toLowerCase()} have friends?`;
        ch = `${subCh}有朋友吗`;
      } else if (hasFriends) {
        eng = `${subEng} have friends.`;
        ch = `${subCh}有朋友`;
      } else {
        eng = `${subEng} do not have friends.`;
        ch = `${subCh}没有朋友`;
      }
      break;
    case 3:
      const phraseType = Math.floor(Math.random() * 3);
      if (phraseType === 0) {
        eng = "Hello!";
        ch = "你好";
      } else if (phraseType === 1) {
        eng = "Goodbye, teacher.";
        ch = "再见老师";
      } else {
        eng = "Goodbye.";
        ch = "再见";
      }
      break;
    case 4:
      const isVery = Math.random() > 0.5;
      if (isVery) {
        eng = `${subEng} ${isPlural ? 'are' : 'is'} very good.`;
        ch = `${subCh}很好`;
      } else {
        eng = `${subEng} ${isPlural ? 'are' : 'is'} good.`;
        ch = `${subCh}好`;
      }
      break;
  }

  eng = eng.replace("I is a", "I am a")
           .replace("I are a", "I am a")
           .replace("Does we", "Do we")
           .replace("Does they", "Do they")
           .replace("Is I a", "Am I a");

  return { english: eng, chinese: ch };
}
function toggleSettings() {
  const p = document.getElementById("apiPanel");
  p.style.display = p.style.display === "block" ? "none" : "block";
}

function saveApiKey() {
  const k = document.getElementById("apiKeyInput").value.trim();
  if(k) {
    localStorage.setItem("gemini_api_key", k);
    alert("Key saved smoothly!");
    toggleSettings();
  }
}

function loadSentence() {
  currentTarget = generateRandomSentence();
  document.getElementById("englishPrompt").innerText = currentTarget.english;
  document.getElementById("userInput").value = "";
  document.getElementById("userInput").disabled = false;
  document.getElementById("userInput").style.display = "block";
  document.getElementById("cameraBtn").style.display = "block";
  document.getElementById("feedbackBox").style.display = "none";
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("actionBtn").style.display = "block";
  document.getElementById("actionBtn").disabled = false;
  document.getElementById("actionBtn").innerText = "Check Answer";
  stopCamera();
  document.getElementById("cameraContainer").style.display = "none";
  document.getElementById("snapshotPreview").style.display = "none";
  capturedImageBase64 = null;
}

async function initiateCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    document.getElementById("videoStream").srcObject = localStream;
    document.getElementById("cameraContainer").style.display = "block";
    document.getElementById("snapshotPreview").style.display = "none";
  } catch (err) {
    alert("Camera access was blocked by system permissions.");
  }
}

function captureSnapshot() {
  const v = document.getElementById("videoStream");
  const c = document.createElement("canvas");
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL("image/jpeg");
  
  // FIXED: Explicitly selecting index [1] grabs ONLY the clean base64 data string
  capturedImageBase64 = dataUrl.split(",")[1]; 
  
  const p = document.getElementById("snapshotPreview");
  p.src = dataUrl;
  p.style.display = "block";
  document.getElementById("userInput").style.display = "none";
  document.getElementById("cameraBtn").style.display = "none";
  stopCamera();
  document.getElementById("cameraContainer").style.display = "none";
}

function stopCamera() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
}
async function checkAnswer() {
  const input = document.getElementById("userInput").value.trim();
  const target = currentTarget.english;
  const expected = currentTarget.chinese;
  const key = localStorage.getItem("gemini_api_key");

  if (!input && !capturedImageBase64) return alert("Please type an answer or capture a photo first!");
  if (!key) {
    alert("Please provide your API key first!");
    toggleSettings();
    return;
  }

  const btn = document.getElementById("actionBtn");
  btn.disabled = true;
  btn.innerText = "Grading with AI...";
  document.getElementById("userInput").disabled = true;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    let contentsArray = [];

    if (capturedImageBase64) {
      contentsArray = [
        { text: `Grade this student's handwritten image Chinese translation. English target: "${target}". Expected baseline: "${expected}". Respond with the requested JSON schema.` },
        { inlineData: { mimeType: "image/jpeg", data: capturedImageBase64 } }
      ];
    } else {
      contentsArray = [{ text: `Grade this student's typed Chinese translation. English target: "${target}". Expected baseline: "${expected}". Student raw input text: "${input}". Respond with the requested JSON schema.` }];
    }

    // FIXED: Formatted configuration matrix to use exact modern SDK standards
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contentsArray,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            isCorrect: { type: "BOOLEAN" },
            feedback: { type: "STRING" }
          },
          required: ["isCorrect", "feedback"]
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    const box = document.getElementById("feedbackBox");
    box.style.display = "block";
    btn.style.display = "none";
    document.getElementById("nextBtn").style.display = "block";

    if (result.isCorrect) {
      box.className = "feedback correct";
      box.innerHTML = "<div>✨ Excellent Job!</div><div style='font-weight:500;margin-top:5px;'>" + result.feedback + "</div>";
    } else {
      box.className = "feedback incorrect";
      box.innerHTML = "<div>Keep Practicing!</div><div style='font-weight:500;margin-top:5px;'>" + result.feedback + " (Expected: " + expected + ")</div>";
    }
  } catch (e) {
    console.error("System connection trace:", e);
    alert("API Error: Verify your AQ key status or connection.");
    loadSentence();
  }
}

function initApp() {
  document.getElementById("toggleSettingsBtn").addEventListener("click", toggleSettings);
  document.getElementById("saveApiKeyBtn").addEventListener("click", saveApiKey);
  document.getElementById("cameraBtn").addEventListener("click", initiateCamera);
  document.getElementById("captureSnapshotBtn").addEventListener("click", captureSnapshot);
  document.getElementById("actionBtn").addEventListener("click", checkAnswer);
  document.getElementById("nextBtn").addEventListener("click", loadSentence);

  loadSentence();
  const savedKey = localStorage.getItem("gemini_api_key");
  if (savedKey) document.getElementById("apiKeyInput").value = savedKey;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
