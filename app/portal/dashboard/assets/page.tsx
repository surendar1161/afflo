"use client";
import { useEffect, useState } from "react";
import { Row, Col, Card, Button, Tag, Typography, Spin, Empty } from "antd";
import { DownloadOutlined, FileImageOutlined, VideoCameraOutlined, MailOutlined, FileTextOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
type Asset = { id:string; name:string; type:string; file_url:string|null; content:string|null; width:number|null; height:number|null; mime_type:string|null; program?:{name:string} };

const TYPE_ICON: Record<string,React.ReactNode> = {
  banner: <FileImageOutlined/>, video:<VideoCameraOutlined/>, email:<MailOutlined/>,
  text:<FileTextOutlined/>, social_post:<FileTextOutlined/>, landing_page:<FileTextOutlined/>,
};
const TYPE_COLOR: Record<string,string> = {
  banner:"blue", video:"purple", email:"green", text:"default", social_post:"cyan", landing_page:"orange",
};

export default function PortalAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    fetch("/api/portal/assets").then(r=>r.json()).then(d=>{
      setAssets(d.assets||[]); setLoading(false);
    });
  }, []);

  const types  = ["all", ...Array.from(new Set(assets.map(a => a.type)))];
  const filtered = filter === "all" ? assets : assets.filter(a => a.type === filter);

  if (loading) return <div style={{display:"flex",justifyContent:"center",padding:80}}><Spin size="large"/></div>;

  return (
    <div>
      <div style={{marginBottom:28}}>
        <Title level={2} style={{margin:"0 0 4px",color:"#f5f5f5"}}>Creative Assets</Title>
        <Text style={{color:"#8fa0b4"}}>Marketing materials provided by your program. Download and use in your campaigns.</Text>
      </div>

      {/* Type filter */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {types.map(t => (
          <button key={t} onClick={()=>setFilter(t)}
            style={{padding:"5px 16px",borderRadius:24,border:`1px solid ${filter===t?"rgba(76,130,247,0.5)":"#e5eaf0"}`,
              background:filter===t?"rgba(44,92,197,0.10)":"transparent",
              color:filter===t?"#2C5CC5":"#8fa0b4",fontSize:13,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty description="No assets available yet." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{padding:48}}/>
      ) : (
        <Row gutter={[16,16]}>
          {filtered.map(a => (
            <Col key={a.id} xs={24} sm={12} lg={8}>
              <Card hoverable>
                {/* Preview */}
                <div style={{height:120,background:"#f2f5f8",borderRadius:6,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                  {a.file_url && a.type==="banner" ? (
                    <img src={a.file_url} alt={a.name} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>
                  ) : (
                    <div style={{fontSize:36,color:"#a0b0c0"}}>{TYPE_ICON[a.type]||<FileTextOutlined/>}</div>
                  )}
                </div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <Text strong style={{color:"#f5f5f5",fontSize:14}}>{a.name}</Text>
                  <Tag color={TYPE_COLOR[a.type]||"default"} style={{textTransform:"capitalize",marginLeft:8,flexShrink:0}}>{a.type.replace("_"," ")}</Tag>
                </div>

                <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                  {a.width && a.height && <Text style={{color:"#a0b0c0",fontSize:11}}>{a.width}×{a.height}px</Text>}
                  {a.mime_type && <Text style={{color:"#a0b0c0",fontSize:11}}>{a.mime_type}</Text>}
                  {a.program?.name && <Text style={{color:"#a0b0c0",fontSize:11}}>by {a.program.name}</Text>}
                </div>

                {a.file_url ? (
                  <Button icon={<DownloadOutlined/>} block size="small"
                    onClick={()=>window.open(a.file_url!,"_blank")}>
                    Download
                  </Button>
                ) : a.content ? (
                  <Button block size="small" onClick={()=>{navigator.clipboard.writeText(a.content!); }}>
                    Copy content
                  </Button>
                ) : (
                  <Button block size="small" disabled>No file</Button>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
