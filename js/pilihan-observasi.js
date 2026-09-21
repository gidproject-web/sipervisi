
(function(){
  "use strict";

  const $ = id => document.getElementById(id);

  const BUKTI_OPTIONS = {
    "Keselarasan": [
      "Terlihat dari kesesuaian kegiatan pembelajaran dengan perencanaan yang telah dibuat.",
      "Terlihat dari keterkaitan antara tujuan pembelajaran, aktivitas murid, dan asesmen yang dilakukan.",
      "Terlihat dari pelaksanaan pembelajaran yang mengikuti alur awal, inti, dan penutup sesuai perencanaan."
    ],
    "Implementasi Kerangka Pembelajaran": [
      "Terlihat dari strategi pembelajaran yang digunakan guru selama proses pembelajaran.",
      "Terlihat dari suasana belajar yang kondusif dan interaksi aktif antara guru dan murid.",
      "Terlihat dari pemanfaatan media/digital serta keterlibatan murid dalam proses pembelajaran."
    ],
    "Langkah Pembelajaran": [
      "Terlihat saat murid aktif mengamati, berdiskusi, mencoba, dan menyampaikan hasil.",
      "Terlihat dari keterlibatan murid dalam kegiatan memahami, mengaplikasi, dan merefleksi.",
      "Terlihat dari interaksi yang saling menghargai antara guru dan murid selama pembelajaran."
    ],
    "Asesmen": [
      "Terlihat dari asesmen yang dilakukan selama proses pembelajaran untuk mengetahui pemahaman murid.",
      "Terlihat dari pemberian umpan balik guru terhadap hasil kerja atau respons murid.",
      "Terlihat dari penggunaan kriteria yang jelas dalam menilai ketercapaian tujuan pembelajaran."
    ],
    "default": [
      "Terlihat dari aktivitas pembelajaran yang berlangsung di kelas.",
      "Terlihat dari respons dan keterlibatan murid selama proses pembelajaran.",
      "Terlihat dari praktik guru yang sesuai dengan aspek yang diamati."
    ]
  };

  const CATATAN_OPTIONS = {
    "Keselarasan": [
      "Pelaksanaan sudah sesuai dengan perencanaan pembelajaran.",
      "Pelaksanaan sudah baik, namun perlu konsistensi agar seluruh tahapan tetap selaras dengan tujuan pembelajaran.",
      "Perlu penguatan pada keterkaitan antara tujuan, kegiatan, dan asesmen."
    ],
    "Implementasi Kerangka Pembelajaran": [
      "Implementasi kerangka pembelajaran sudah berjalan dengan baik.",
      "Sudah baik, namun perlu penguatan pada variasi strategi dan pemanfaatan sumber belajar.",
      "Perlu penguatan agar lingkungan belajar dan strategi pembelajaran lebih mendukung keterlibatan murid."
    ],
    "Langkah Pembelajaran": [
      "Langkah pembelajaran sudah berjalan runtut dan melibatkan murid secara aktif.",
      "Sudah baik, namun perlu pemerataan keterlibatan seluruh murid.",
      "Perlu penguatan pada kegiatan refleksi dan pemberian ruang bagi murid untuk menyampaikan pemahamannya."
    ],
    "Asesmen": [
      "Asesmen sudah digunakan untuk memantau ketercapaian tujuan pembelajaran.",
      "Sudah baik, namun umpan balik kepada murid masih dapat dibuat lebih spesifik.",
      "Perlu penguatan pada kejelasan kriteria asesmen dan tindak lanjut hasil asesmen."
    ],
    "default": [
      "Pelaksanaan sudah berjalan dengan baik.",
      "Sudah baik, namun masih perlu penguatan pada beberapa bagian.",
      "Perlu tindak lanjut agar pelaksanaan pada aspek ini lebih optimal."
    ]
  };

  function getGroupForRow(row){
    let prev=row.previousElementSibling;
    while(prev){
      if(prev.classList.contains("group-row")) return prev.textContent.trim();
      prev=prev.previousElementSibling;
    }
    return "default";
  }

  function matchGroup(group, source){
    if(group.includes("Keselarasan")) return source["Keselarasan"];
    if(group.includes("Implementasi Kerangka")) return source["Implementasi Kerangka Pembelajaran"];
    if(group.includes("Langkah")) return source["Langkah Pembelajaran"];
    if(group.includes("Asesmen")) return source["Asesmen"];
    return source.default;
  }

  function addChoiceBlock(row, textarea, source, label){
    if(textarea.previousElementSibling?.classList?.contains("observasi-choice-wrap")) return;

    const group=getGroupForRow(row);
    const options=matchGroup(group,source);

    const wrap=document.createElement("div");
    wrap.className="observasi-choice-wrap";
    wrap.innerHTML=`
      <div class="observasi-choice-label">${label}</div>
      <div class="observasi-choice-buttons">
        ${options.map((text,i)=>`
          <button type="button" class="observasi-choice-btn" data-index="${i}">
            Pilihan ${i+1}
          </button>`).join("")}
        <button type="button" class="observasi-choice-btn manual" data-manual="1">
          Lainnya / Tulis Manual
        </button>
      </div>
    `;

    textarea.parentNode.insertBefore(wrap,textarea);

    wrap.querySelectorAll("[data-index]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        textarea.value=options[Number(btn.dataset.index)];
        textarea.dispatchEvent(new Event("input",{bubbles:true}));
        textarea.focus();
      });
    });

    wrap.querySelector("[data-manual]").addEventListener("click",()=>{
      textarea.value="";
      textarea.focus();
      textarea.dispatchEvent(new Event("input",{bubbles:true}));
    });
  }

  function install(){
    const body=$("observasiBody");
    if(!body) return;

    body.querySelectorAll("tr").forEach(row=>{
      if(row.classList.contains("group-row")) return;
      const areas=row.querySelectorAll("textarea");
      if(areas.length<2) return;

      addChoiceBlock(row,areas[0],BUKTI_OPTIONS,"Pilihan bukti pembelajaran:");
      addChoiceBlock(row,areas[1],CATATAN_OPTIONS,"Pilihan catatan supervisor:");
    });
  }

  document.addEventListener("DOMContentLoaded",()=>{
    install();
    const body=$("observasiBody");
    if(body){
      const observer=new MutationObserver(()=>install());
      observer.observe(body,{childList:true,subtree:true});
    }
  });
})();
