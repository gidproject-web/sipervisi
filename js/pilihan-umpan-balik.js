
(function(){
  "use strict";

  const $ = id => document.getElementById(id);

  const FEEDBACK_BY_GROUP = {
    "Keselarasan": [
      {label:"Sangat Baik",score:"4",text:"Perencanaan sudah tergambar sangat baik, selaras, dan relevan dengan tujuan pembelajaran."},
      {label:"Baik",score:"3",text:"Perencanaan sudah tergambar dengan baik dan relevan dengan tujuan pembelajaran."},
      {label:"Cukup",score:"2",text:"Perencanaan sudah cukup tergambar, namun masih perlu diperjelas agar lebih selaras dengan tujuan pembelajaran."},
      {label:"Perlu Perbaikan",score:"1",text:"Perencanaan belum tergambar secara optimal dan perlu diperbaiki agar lebih selaras dengan tujuan pembelajaran."}
    ],
    "Kerangka Pembelajaran": [
      {label:"Sangat Baik",score:"4",text:"Kerangka pembelajaran sudah tergambar sangat baik dan konsisten dalam perencanaan pembelajaran."},
      {label:"Baik",score:"3",text:"Kerangka pembelajaran sudah tergambar dengan baik dan mendukung proses pembelajaran."},
      {label:"Cukup",score:"2",text:"Kerangka pembelajaran sudah mulai tergambar, namun masih perlu diperjelas agar lebih konsisten."},
      {label:"Perlu Perbaikan",score:"1",text:"Kerangka pembelajaran belum tergambar secara memadai dan perlu diperkuat dalam perencanaan."}
    ],
    "Langkah Pembelajaran": [
      {label:"Sangat Baik",score:"4",text:"Langkah pembelajaran sudah dirancang sangat baik, runtut, dan mampu memfasilitasi pengalaman belajar murid."},
      {label:"Baik",score:"3",text:"Langkah pembelajaran sudah tergambar dengan baik dan mendukung keterlibatan aktif murid."},
      {label:"Cukup",score:"2",text:"Langkah pembelajaran sudah cukup tergambar, namun masih perlu penguatan agar pengalaman belajar murid lebih optimal."},
      {label:"Perlu Perbaikan",score:"1",text:"Langkah pembelajaran belum tergambar secara optimal dan perlu diperbaiki agar lebih sesuai dengan kebutuhan murid."}
    ],
    "Asesmen": [
      {label:"Sangat Baik",score:"4",text:"Asesmen sudah dirancang sangat baik, jelas, dan selaras dengan tujuan pembelajaran."},
      {label:"Baik",score:"3",text:"Asesmen sudah tergambar dengan baik dan dapat mendukung ketercapaian tujuan pembelajaran."},
      {label:"Cukup",score:"2",text:"Asesmen sudah cukup tergambar, namun masih perlu diperjelas pada kriteria dan keterkaitannya dengan tujuan pembelajaran."},
      {label:"Perlu Perbaikan",score:"1",text:"Asesmen belum tergambar secara memadai dan perlu diperbaiki agar dapat mengukur ketercapaian tujuan pembelajaran dengan lebih jelas."}
    ],
    "default": [
      {label:"Sangat Baik",score:"4",text:"Perencanaan sudah tergambar sangat baik, jelas, dan relevan dengan tujuan pembelajaran."},
      {label:"Baik",score:"3",text:"Perencanaan sudah tergambar dengan baik dan relevan dengan tujuan pembelajaran."},
      {label:"Cukup",score:"2",text:"Perencanaan sudah cukup tergambar, namun masih perlu diperjelas pada beberapa bagian."},
      {label:"Perlu Perbaikan",score:"1",text:"Perencanaan belum tergambar secara optimal dan masih memerlukan perbaikan."}
    ]
  };

  function getGroupForRow(row){
    let prev = row.previousElementSibling;
    while(prev){
      if(prev.classList.contains("group-row")){
        return prev.textContent.trim();
      }
      prev = prev.previousElementSibling;
    }
    return "default";
  }

  function getOptions(group){
    if(group.includes("Keselarasan")) return FEEDBACK_BY_GROUP["Keselarasan"];
    if(group.includes("Kerangka")) return FEEDBACK_BY_GROUP["Kerangka Pembelajaran"];
    if(group.includes("Langkah")) return FEEDBACK_BY_GROUP["Langkah Pembelajaran"];
    if(group.includes("Asesmen")) return FEEDBACK_BY_GROUP["Asesmen"];
    return FEEDBACK_BY_GROUP.default;
  }

  function addChooser(row, textarea, select){
    if(row.querySelector(".feedback-choice-wrap")) return;

    const group = getGroupForRow(row);
    const options = getOptions(group);

    const wrap = document.createElement("div");
    wrap.className = "feedback-choice-wrap";
    wrap.innerHTML = `
      <div class="feedback-choice-label">Pilihan umpan balik:</div>
      <div class="feedback-choice-buttons">
        ${options.map((o,i)=>`
          <button type="button" class="feedback-choice-btn level-${o.score}" data-opt="${i}">
            ${o.label}
          </button>`).join("")}
        <button type="button" class="feedback-choice-btn manual" data-manual="1">
          Lainnya / Tulis Manual
        </button>
      </div>
    `;

    textarea.parentNode.insertBefore(wrap, textarea);

    wrap.querySelectorAll("[data-opt]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const opt = options[Number(btn.dataset.opt)];
        textarea.value = opt.text;
        if(select){
          select.value = opt.score;
          select.dispatchEvent(new Event("change",{bubbles:true}));
        }
        textarea.dispatchEvent(new Event("input",{bubbles:true}));
        textarea.focus();
      });
    });

    wrap.querySelector("[data-manual]").addEventListener("click",()=>{
      textarea.value = "";
      textarea.focus();
      textarea.dispatchEvent(new Event("input",{bubbles:true}));
    });
  }

  function install(){
    const body = $("perencanaanBody");
    if(!body) return;

    body.querySelectorAll("tr").forEach(row=>{
      if(row.classList.contains("group-row")) return;
      const textarea = row.querySelector('textarea[id^="p_fb_"]');
      if(!textarea) return;
      const select = row.querySelector('select[id^="p_score_"]');
      addChooser(row, textarea, select);
    });
  }

  document.addEventListener("DOMContentLoaded",()=>{
    install();
    const body = $("perencanaanBody");
    if(body){
      const observer = new MutationObserver(()=>install());
      observer.observe(body,{childList:true,subtree:true});
    }
  });
})();
