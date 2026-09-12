const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const imagePreview = document.getElementById('imagePreview');
const solveBtn = document.getElementById('solveBtn');
const outputCard = document.getElementById('outputCard');
const solutionText = document.getElementById('solutionText');
const loading = document.getElementById('loading');

let base64Image = null;

let GEMINI_API_KEY = localStorage.getItem("gemini_key") || "";
if (!GEMINI_API_KEY) {
  const k = prompt("Please enter your Gemini API Key:");
  if (k && k.trim()) {
    localStorage.setItem("gemini_key", k.trim());
    GEMINI_API_KEY = k.trim();
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      base64Image = event.target.result.split(',')[1];
      imagePreview.src = event.target.result;
      imagePreview.style.display = 'block';
      solveBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

if (cameraInput) cameraInput.addEventListener('change', handleFileSelect);
if (galleryInput) galleryInput.addEventListener('change', handleFileSelect);

async function solveProblem() {
  if (!base64Image) {
    alert("অনুগ্ৰহ কৰি প্ৰথমে এখন ফটো বাছক।");
    return;
  }

  if (!GEMINI_API_KEY) {
    const k = prompt("Please enter your Gemini API Key:");
    if (k && k.trim()) {
      localStorage.setItem("gemini_key", k.trim());
      GEMINI_API_KEY = k.trim();
    } else {
      alert("API Key প্ৰয়োজন।");
      return;
    }
  }

  loading.style.display = 'block';
  outputCard.style.display = 'none';

  const promptText = `You are an expert tutor for AHSEC Higher Secondary (H.S.) 2nd Year Mathematics in Assam.
Look at the mathematical problem in the image.
1. Identify the chapter/topic.
2. Provide a clear, step-by-step solution. You can explain in simple Assamese or English.
3. CRITICAL: Enclose EVERY mathematical formula, variable, and expression in LaTeX notation using $ for inline math (e.g. $y = \\sin^{-1}(x)$) and $$ for standalone display math (e.g. $$\\frac{a}{b}$$).
4. Format key headings with bold text.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      solutionText.innerText = "Google API Error: " + data.error.message;
    } else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const rawText = data.candidates[0].content.parts[0].text;
      solutionText.innerHTML = rawText
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([solutionText]).catch(err => console.error(err));
      }
    } else {
      solutionText.innerText = "Error parsing response: " + JSON.stringify(data);
    }

    outputCard.style.display = 'block';
  } catch (error) {
    console.error(error);
    solutionText.innerText = "সংযোগে সমস্যা হৈছে। ইণ্টাৰনেট সংযোগ আৰু API Key পৰীক্ষা কৰক।";
    outputCard.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }
}

if (solveBtn) solveBtn.addEventListener('click', solveProblem);
