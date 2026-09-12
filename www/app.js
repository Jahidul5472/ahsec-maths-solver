const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const imagePreview = document.getElementById('imagePreview');
const solveBtn = document.getElementById('solveBtn');
const loading = document.getElementById('loading');
const outputCard = document.getElementById('outputCard');
const solutionText = document.getElementById('solutionText');

let base64Image = '';

// Paste your actual Gemini API key between the quotes below
const GEMINI_API_KEY = localStorage.getItem("gemini_key") || ""; if (!GEMINI_API_KEY) {
  const k = prompt("Please enter your Gemini API Key:");
  if (k) {
    localStorage.setItem("gemini_key", k.trim());
    location.reload();
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
    alert("অনুগ্রহ কৰি প্ৰথমে এখন ফটো বাছক।");
    return;
  }

  if (GEMINI_API_KEY === "PASTE_YOUR_API_KEY_HERE" || !GEMINI_API_KEY) {
    alert("API Key সংযোগ কৰা হোৱা নাই। অনুগ্ৰহ কৰি আপোনাৰ Gemini API Key বহুৱাওক।");
    return;
  }

  loading.style.display = 'block';
  outputCard.style.display = 'none';

  const promptText = `
  You are an expert tutor for AHSEC Higher Secondary (H.S.) 2nd Year Mathematics in Assam.
  Look at the mathematical problem in the image.
  1. Identify the chapter/topic (e.g., Relations and Functions, Inverse Trigonometric Functions, Matrices, Determinants, Continuity and Differentiability, Application of Derivatives, Integrals, Application of Integrals, Differential Equations, Vector Algebra, Three Dimensional Geometry, Linear Programming, Probability).
  2. Provide a clear, step-by-step solution strictly in simple Assamese (অসমীয়া ভাষাত).
  3. Keep mathematical formulas, equations, and steps clear and properly structured.
  4. Explain each step simply so an AHSEC board student can easily understand and write it in the final examination.
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      solutionText.innerText = "Google API Error: " + data.error.message;
    } else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      solutionText.innerText = data.candidates[0].content.parts[0].text;
    } else {
      solutionText.innerText = "Response received but no solution found: " + JSON.stringify(data);
    }

    outputCard.style.display = "block";
  } catch (error) {
    console.error(error);
    solutionText.innerText = "সংযোগত সমস্যা হৈছে। ইণ্টাৰনেট সংযোগ আৰু API Key পৰীক্ষা কৰক।";
    outputCard.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }
}
