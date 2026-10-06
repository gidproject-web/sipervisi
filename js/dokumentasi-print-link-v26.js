
(function(){
  document.addEventListener("DOMContentLoaded",()=>{
    const btn=document.getElementById("btnCetakDokumentasi");
    if(!btn) return;
    btn.addEventListener("click",(e)=>{
      e.preventDefault();
      e.stopImmediatePropagation();

      const jadwalId=new URLSearchParams(location.search).get("jadwal_id");
      if(!jadwalId){
        alert("jadwal_id tidak ditemukan.");
        return;
      }

      window.open(`dokumentasi-print.html?jadwal_id=${encodeURIComponent(jadwalId)}`,"_blank");
    },true);
  });
})();
