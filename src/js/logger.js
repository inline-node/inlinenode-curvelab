const Logger=(()=>{const el=()=>document.getElementById('logger');
  function line(t){const e=document.createElement('div');e.textContent=t;el().appendChild(e);el().scrollTop=el().scrollHeight;}
  return{info:line,clear:()=>{el().innerHTML='';}};
})();
