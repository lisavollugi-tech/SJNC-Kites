import { firebaseConfig } from "./firebase-config.js";

const schedule = [
  { id:"r1", number:"1", date:"18 July", title:"Round 1" },
  { id:"r2", number:"2", date:"25 July", title:"Round 2" },
  { id:"r3", number:"3", date:"1 August", title:"Round 3 (BYE)", special:"bye" },
  { id:"r4", number:"4", date:"8 August", title:"Round 4" },
  { id:"r5", number:"5", date:"15 August", title:"Round 5" },
  { id:"r6", number:"6", date:"22 August", title:"Round 6" },
  { id:"r7", number:"7", date:"29 August", title:"Round 7" },
  { id:"r8", number:"8", date:"5 September", title:"Round 8" },
  { id:"r9", number:"9", date:"12 September", title:"Round 9" },
  { id:"holidays", date:"19 September – 3 October", title:"No games – School holidays", special:"special" },
  { id:"r10", number:"10", date:"10 October", title:"Round 10" },
  { id:"r11", number:"11", date:"17 October", title:"Round 11" },
  { id:"r12", number:"12", date:"24 October", title:"Round 12" },
  { id:"cup", date:"31 October", title:"No games – Melbourne Cup weekend", special:"cup" },
  { id:"r13", number:"13", date:"7 November", title:"Round 13" },
  { id:"r14", number:"14", date:"14 November", title:"Round 14" },
  { id:"r15", number:"15", date:"21 November", title:"Round 15" },
  { id:"r16", number:"16", date:"28 November", title:"Round 16" },
  { id:"final", date:"5 December", title:"11 & Under Round Robin", special:"special" }
];

const roster = ["Rosie","Sybella","Willow","Eva","Evie","Hazel","Imbi","Lana","Lola","Olivia"];

const container = document.getElementById("roundsContainer");
const dialog = document.getElementById("absenceDialog");
const form = document.getElementById("absenceForm");
const childName = document.getElementById("childName");
const parentName = document.getElementById("parentName");
const dialogTitle = document.getElementById("dialogTitle");
const dialogDate = document.getElementById("dialogDate");
const connectionStatus = document.getElementById("connectionStatus");
const toast = document.getElementById("toast");

let activeRound = null;
let liveData = {};
let unsubscribe = null;
let firestoreApi = null;
const localKey = "sjnc-kites-mobile-demo-2026";

function esc(value=""){
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[char]));
}

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function render(){
  container.innerHTML = schedule.map(item => {
    if(item.special){
      const cupClass = item.special === "cup" ? " cup" : "";
      const subtitle = item.special === "bye" ? "No absence entry required" : item.date;
      return `
        <section class="special-card${cupClass}">
          <h3>${esc(item.title)}</h3>
          <p>${esc(subtitle)}</p>
        </section>`;
    }

    const entries = Object.entries(liveData[item.id] || {})
      .map(([entryId, entry]) => ({entryId, ...entry}))
      .sort((a,b) => (a.childName || "").localeCompare(b.childName || ""));

    const names = entries.length
      ? entries.map(entry => `
          <span class="name-chip">
            ${esc(entry.childName)}
            <button class="remove-name" type="button"
              data-round="${item.id}"
              data-entry="${esc(entry.entryId)}"
              data-name="${esc(entry.childName)}"
              aria-label="Remove ${esc(entry.childName)}">×</button>
          </span>`).join("")
      : `<span class="empty-state">No absences entered yet</span>`;

    return `
      <section class="round-card">
        <div class="round-card-header">
          <div class="round-title-wrap">
            <div class="round-badge">${esc(item.number)}</div>
            <div>
              <h3>${esc(item.title)}</h3>
              <p class="round-date">Saturday ${esc(item.date)}</p>
            </div>
          </div>
          <div class="count-badge">${entries.length} away</div>
        </div>

        <div class="round-card-body">
          <div class="absent-label">Absent</div>
          <div class="name-list">${names}</div>
          <button class="add-button" type="button" data-add="${item.id}">+ Add your child</button>
        </div>
      </section>`;
  }).join("");
}

function openDialog(roundId){
  activeRound = schedule.find(item => item.id === roundId);
  dialogTitle.textContent = activeRound.title;
  dialogDate.textContent = `Saturday ${activeRound.date}`;
  childName.value = "";
  parentName.value = "";
  dialog.showModal();
  setTimeout(() => childName.focus(), 50);
}

function closeDialog(){
  dialog.close();
  activeRound = null;
}

function readLocal(){
  try{
    liveData = JSON.parse(localStorage.getItem(localKey) || "{}");
  }catch{
    liveData = {};
  }
  render();
}

function saveLocal(){
  localStorage.setItem(localKey, JSON.stringify(liveData));
}

async function addLocalAbsence(roundId, child, parent){
  if(!liveData[roundId]) liveData[roundId] = {};
  const exists = Object.values(liveData[roundId]).some(
    entry => (entry.childName || "").toLowerCase() === child.toLowerCase()
  );
  if(exists) throw new Error(`${child} is already listed for this round.`);

  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  liveData[roundId][id] = {
    childName: child,
    parentName: parent,
    createdAt: new Date().toISOString()
  };
  saveLocal();
  render();
}

async function removeLocalAbsence(roundId, entryId){
  if(liveData[roundId]) delete liveData[roundId][entryId];
  saveLocal();
  render();
}

async function startFirebase(){
  const configured = firebaseConfig &&
    firebaseConfig.apiKey &&
    !String(firebaseConfig.apiKey).includes("PASTE_");

  if(!configured){
    connectionStatus.textContent = "Demo mode — add Firebase details to share live";
    connectionStatus.className = "status-pill demo";
    readLocal();
    return;
  }

  try{
    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const dbModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

    const app = appModule.initializeApp(firebaseConfig);
    const db = dbModule.getFirestore(app);

    firestoreApi = { db, ...dbModule };

    const absencesRef = dbModule.collection(db, "seasons", "spring-2026", "absences");
    unsubscribe = dbModule.onSnapshot(absencesRef, snapshot => {
      const next = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if(!next[data.roundId]) next[data.roundId] = {};
        next[data.roundId][docSnap.id] = data;
      });
      liveData = next;
      render();
      connectionStatus.textContent = "Live shared list connected";
      connectionStatus.className = "status-pill live";
    }, error => {
      console.error(error);
      connectionStatus.textContent = "Firebase connection error";
      connectionStatus.className = "status-pill error";
      showToast("Could not connect to the shared list");
    });
  }catch(error){
    console.error(error);
    connectionStatus.textContent = "Firebase setup incomplete";
    connectionStatus.className = "status-pill error";
    readLocal();
  }
}

async function addFirebaseAbsence(roundId, child, parent){
  const { db, collection, query, where, getDocs, addDoc, serverTimestamp } = firestoreApi;
  const absencesRef = collection(db, "seasons", "spring-2026", "absences");
  const duplicateQuery = query(
    absencesRef,
    where("roundId", "==", roundId),
    where("childNameLower", "==", child.toLowerCase())
  );
  const duplicate = await getDocs(duplicateQuery);
  if(!duplicate.empty) throw new Error(`${child} is already listed for this round.`);

  await addDoc(absencesRef, {
    roundId,
    childName: child,
    childNameLower: child.toLowerCase(),
    parentName: parent,
    createdAt: serverTimestamp()
  });
}

async function removeFirebaseAbsence(entryId){
  const { db, doc, deleteDoc } = firestoreApi;
  await deleteDoc(doc(db, "seasons", "spring-2026", "absences", entryId));
}

container.addEventListener("click", async event => {
  const addButton = event.target.closest("[data-add]");
  if(addButton){
    openDialog(addButton.dataset.add);
    return;
  }

  const removeButton = event.target.closest("[data-entry]");
  if(removeButton){
    const name = removeButton.dataset.name;
    const confirmed = confirm(`Remove ${name} from this round's absence list?`);
    if(!confirmed) return;

    try{
      if(firestoreApi){
        await removeFirebaseAbsence(removeButton.dataset.entry);
      }else{
        await removeLocalAbsence(removeButton.dataset.round, removeButton.dataset.entry);
      }
      showToast(`${name} removed`);
    }catch(error){
      console.error(error);
      showToast("Could not remove this name");
    }
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if(!activeRound) return;

  const child = childName.value.trim().replace(/\s+/g," ");
  const parent = parentName.value.trim().replace(/\s+/g," ");
  if(!child) return;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Adding…";

  try{
    if(firestoreApi){
      await addFirebaseAbsence(activeRound.id, child, parent);
    }else{
      await addLocalAbsence(activeRound.id, child, parent);
    }
    closeDialog();
    showToast(`${child} added`);
  }catch(error){
    console.error(error);
    showToast(error.message || "Could not add this absence");
  }finally{
    submitButton.disabled = false;
    submitButton.textContent = "Add absence";
  }
});

document.getElementById("closeDialog").addEventListener("click", closeDialog);
document.getElementById("cancelButton").addEventListener("click", closeDialog);

document.getElementById("quickNames").innerHTML = roster
  .map(name => `<button type="button" class="quick-name">${name}</button>`)
  .join("");

document.getElementById("quickNames").addEventListener("click", event => {
  const button = event.target.closest(".quick-name");
  if(button) childName.value = button.textContent;
});

window.addEventListener("beforeunload", () => {
  if(unsubscribe) unsubscribe();
});

render();
startFirebase();
