let state = "init";
let pendingChallenges = [];
let currentName = "";

function getOneImage() {
  const url = `https://picsum.photos/320/240`;
  return fetch(url, {
    cache: "no-store",
  }).then((response) => {
    if (!response.ok) throw response;
    return response.blob().then((blob) => {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = URL.createObjectURL(blob);
        image.addEventListener("load", (event) => {
          image.setAttribute("permanent-url", response.url);
          resolve(image);
        });
        image.addEventListener("error", (error) => {
          reject(error);
        });
      });
    });
  }).catch((error) => {
    console.log(`fetch failed`, error);
  });
}

function getMultipleImages(count, andAlsoThis) {
  document.getElementById("showsum").innerHTML = "loading...";
  const images = [];
  for (let i=0; i<count; i++) {
    images.push(getOneImage());
  }
  if (andAlsoThis) {
    const index = Math.floor(Math.random() * images.length);
    images.splice(index, 0, new Promise((resolve, reject) => {
      const image = new Image();
      image.src = andAlsoThis;
      image.addEventListener("load", (event) => {
        image.setAttribute("permanent-url", andAlsoThis);
        image.setAttribute("is-this-the-right-one", "yes");
        resolve(image);
      });
      image.addEventListener("error", (error) => {
        reject(error);
      });
    }));
  }
  return Promise.all(images);
}

function fetchImages() {
  if ((state !== "init") && (state !== "fetchum")) {
    window.alert("wrong state");
    return;
  }
  state = "fetchum";
  document.getElementById("promptum").innerText = "Pick any image";
  getMultipleImages(6).then((images) => {
    const showsum = document.getElementById("showsum");
    showsum.innerHTML = "";
    for (const image of images) {
      showsum.appendChild(image);
    }
  });
}

function showImagesForChallenge(name, url) {
  if (state !== "decodum") {
    window.alert("wrong state");
    return;
  }
  currentName = name;
  document.getElementById("promptum").innerText = `Which one is '${name}'?`;
  getMultipleImages(5, url).then((images) => {
    const showsum = document.getElementById("showsum");
    showsum.innerHTML = "";
    for (const image of images) {
      showsum.appendChild(image);
    }
  });
}

function validateName(name) {
  name = name.toUpperCase().trim();
  if (name.length > 8) return null;
  if (name.match(/[^A-Z0-9]/)) return null;
  return name;
}

function callTheUserStupid() {
  const promptum = document.getElementById("promptum");
  promptum.innerText = "WRONG, stupid!";
  window.setTimeout(() => {
    document.getElementById("promptum").innerText = `Which one is '${currentName}'?`;
  }, 2000);
}

function clickInImages(event) {
  const image = event.target;
  if (!image || (image.tagName !== "IMG")) return;
  const url = image.getAttribute("permanent-url");
  if (!url) return;
  switch (state) {
    
    case "fetchum": {
        let name = window.prompt(`Name for this image:`);
        if (!name) return;
        if (!(name = validateName(name))) {
          window.alert("No, pick a less stupid name.");
          return;
        }
        document.getElementById("textum").value += `${name} ${url}\n`;
      } break;
      
    case "decodum": {
        const rightAnswer = image.getAttribute("is-this-the-right-one");
        if (rightAnswer === "yes") {
          beginNextChallenge();
        } else {
          callTheUserStupid();
        }
      } break;
      
  }
}

function isPlaintextChallenge(text) {
  let picc = 0;
  for (let p=0; p<text.length; ) {
    let nlp = text.indexOf("\n", p);
    if (nlp < 0) nlp = text.length;
    const line = text.substring(p, nlp).trim();
    if (line.length) {
      if (!line.match(/^[A-Z0-9]{1,8} http.*$/)) return false;
      picc++;
    }
    p = nlp + 1;
  }
  return !!picc;
}

function encodeChallenge() {
  const plaintext = document.getElementById("textum").value;
  if (!isPlaintextChallenge(plaintext)) {
    window.alert("Text content is not a plaintext challenge.");
    return;
  }
  // The random number here prevents the start of the encoded data from revealing the first name.
  // ...to people who read base64
  const ciphertext = btoa(`${Math.random()}\n${plaintext}`);
  document.getElementById("textum").value = ciphertext;
  state = "encodum";
}

function beginNextChallenge() {
  if (state !== "decodum") return;
  const challenge = pendingChallenges.splice(0, 1);
  if (!challenge.length) {
    document.getElementById("promptum").innerText = "";
    document.getElementById("showsum").innerHTML = "";
    window.alert("You win!");
  } else {
    const [name, url] = challenge[0].split(" ");
    if (name && url) {
      showImagesForChallenge(name, url);
    } else {
      document.getElementById("promptum").innerText = "";
      document.getElementById("showsum").innerHTML = "";
      window.alert("You win!");
    }
  }
}

function decodeChallenge() {
  const ciphertext = document.getElementById("textum").value.trim();
  const plaintext = atob(ciphertext);
  const nlp = plaintext.indexOf("\n");
  if (nlp < 0) return;
  const challenge = plaintext.substr(nlp + 1);
  if (!isPlaintextChallenge(challenge)) return;
  state = "decodum";
  pendingChallenges = challenge.split("\n");
  document.getElementById("textum").value = "";
  beginNextChallenge();
}

window.addEventListener("load", () => {
  document.getElementById("fetchum").addEventListener("click", () => fetchImages());
  document.getElementById("encodum").addEventListener("click", () => encodeChallenge());
  document.getElementById("decodum").addEventListener("click", () => decodeChallenge());
  document.getElementById("showsum").addEventListener("click", (event) => clickInImages(event));
});
