export default function Home() {
  return (
    <main style={{fontFamily:"Inter,system-ui,sans-serif",minHeight:"100vh",background:"#09090b",color:"#fafafa",padding:"48px"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{fontSize:14,opacity:.65,letterSpacing:2}}>WGM VIDEO</div>
        <h1 style={{fontSize:56,lineHeight:1.05,margin:"18px 0"}}>Your AI video studio.</h1>
        <p style={{fontSize:20,lineHeight:1.6,opacity:.78,maxWidth:700}}>
          WGM Video connects Claude to fal.ai so Claude can plan, generate and return video results through a remote MCP connector.
        </p>
        <div style={{marginTop:40,padding:24,border:"1px solid #27272a",borderRadius:18,background:"#111113"}}>
          <h2>Claude connector</h2>
          <p style={{opacity:.75}}>Use this URL as your custom connector:</p>
          <code style={{display:"block",padding:14,background:"#09090b",borderRadius:10,wordBreak:"break-all"}}>
            {process.env.NEXT_PUBLIC_WGM_MCP_URL || "/api/mcp"}
          </code>
          <p style={{opacity:.6,fontSize:14,marginTop:18}}>
            The MCP endpoint is intended for Claude. Keep FAL_KEY only in Vercel server environment variables.
          </p>
        </div>
      </div>
    </main>
  );
}