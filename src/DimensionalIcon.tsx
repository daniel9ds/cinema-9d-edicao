import React from 'react';
export const DimensionalIcon:React.FC<{kind:string;color:string;surface:string}>=({kind,color,surface})=> <div style={{position:'relative',width:100,height:100,margin:'auto',transform:'perspective(900px) rotateX(8deg) rotateY(-8deg)'}}>
  {[10,6,2].map((offset,i)=><div key={offset} style={{position:'absolute',inset:0,borderRadius:24,background:color,opacity:.35+i*.2,transform:`translate(${offset*.6}px,${offset}px)`}}/>)}
  <div style={{position:'absolute',inset:0,borderRadius:24,background:surface,border:`1px solid ${color}55`,display:'grid',placeItems:'center'}}>
    <svg viewBox="0 0 64 64" width={66} height={66} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      {kind==='people'?<><circle cx={32} cy={17} r={8}/><circle cx={12} cy={25} r={6}/><circle cx={52} cy={25} r={6}/><path d="M18 56V44a14 14 0 0 1 28 0v12M3 56V45a9 9 0 0 1 12-8M61 56V45a9 9 0 0 0-12-8"/></>:
      kind==='link'?<><path d="m27 42-6 6a12 12 0 0 1-17-17l13-13a12 12 0 0 1 17 0M37 22l6-6a12 12 0 0 1 17 17L47 46a12 12 0 0 1-17 0M23 40l18-18"/></>:
      kind==='opportunity'?<><rect x={6} y={22} width={52} height={34} rx={7}/><path d="M21 22V12h22v10M6 35c17 7 35 7 52 0M32 35v13"/></>:
      kind==='search'?<><circle cx={28} cy={27} r={19}/><path d="m43 43 15 15"/></>:
      <><rect x={13} y={7} width={38} height={50} rx={6}/><path d="M23 22h18M23 33h18M23 44h10"/></>}
    </svg>
  </div>
</div>;
