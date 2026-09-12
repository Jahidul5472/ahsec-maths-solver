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

function wrapLatexExpressions(text) {
  // If text already has $ or $$, keep it. Otherwise, auto-wrap standalone LaTeX lines
  return text.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('\\') && !trimmed.startsWith('$')) {
      return `$$${trimmed}$$`;
    }
    // Wrap inline math like y = \frac{...}
    if (line.includes('\\') && !line.includes('$')) {
      return line.replace(/([a-zA-Z0-9_]+\s*=\s*\\[^,\n]+|\\[a-zA-Z]+(\{[^}]*\})*)/g, '$$$1$$');
    }
    return line;
  }).join('\n');
}

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

  const promptText = `You are a high school mathematics teacher.
Solve the mathematics problem presented in the image step-by-step.
Language: Provide explanations in Assamese or simple English.
IMPORTANT FORMATTING RULES:
1. Every mathematical symbol, equation, variable, fraction, and formula MUST be enclosed inside LaTeX math delimiters.
2. Use single dollar signs $...$ for inline equations (example: $y = \\sin^{-1}(\\frac{1}{\\sqrt{2}})$).
3. Use double dollar signs $$...$$ for display equations on their own lines.
4. NEVER write raw LaTeX commands like \\frac or \\left without enclosing them in $ or $$.`;

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
      let rawText = data.candidates[0].content.parts[0].text;
      
      // Auto-wrap any unescaped LaTeX that missed delimiters
      rawText = wrapLatexExpressions(rawText);

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
